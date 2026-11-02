// Controladores reales de la página, con HTTP/almacenamiento/tiempo simulados; sin DOM.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { allRadiografiasValidated } from './radiografiaValidation.js';
import { analysisReceipt } from './resultDetails.js';
import { assertAnalysisResults } from './analysisTiming.js';

const page = readFileSync(new URL('../pages/EvaluacionClinica.jsx', import.meta.url), 'utf8');
function controller(name, context, async = true) {
  const body = page.split(`const ${name} = ${async ? 'async ' : ''}() => {`)[1].split('\n  };')[0];
  return new Function(...Object.keys(context), `return ${async ? 'async ' : ''}() => {${body}}`)(...Object.values(context));
}
const receipt = () => ({ evaluacionId: 12, results: [{ id_radiografia: 21, id_resultado: 31 }] });
const stored = id => ({ id: String(id), id_bd: id, tipo: '1', file: null, validationStatus: 'stored' });
const replacement = id => {
  const file = new File(['imagen-ficticia'], 'nueva.png', { type: 'image/png' });
  return { ...stored(id), file, validatedFile: file, validationStatus: 'valid' };
};

function storage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
}

function fixture(rows = [replacement(21)], ok = true) {
  const state = { receipt: receipt(), ready: true, details: { radiografias: ['antigua'], detecciones: ['antigua'] }, step: 3, invalidations: 0, requests: [] };
  const context = {
    currentStep: 3, patientMode: 'search', evaluacionId: 12, radiografias: rows,
    receiptRef: { current: state.receipt }, allRadiografiasValidated,
    getRadiografiaPreviewSrc: () => '',
    authenticatedFetch: async (url, options) => {
      state.requests.push({ url, options });
      return { ok, json: async () => ok ? { radiografias: rows.map(row => ({ id_radiografia: row.id_bd, local_id: row.id })) } : { error: 'fallo simulado' } };
    },
    setIsSubmitting: () => {}, setRadiografias: () => {}, setSuccessMessage: () => {}, setIsSuccess: () => {},
    setCurrentStep: value => { state.step = value; },
    setTimeout: fn => fn(), alert: () => {},
    analysisGenerationRef: { current: 0 }, analysisRunRef: { current: null },
    detailRequestRef: { current: 0 }, detailLoaderRef: { current: { cancel() {} } },
    interruptedRef: { current: false },
    setAnalysisResultsReady: value => { state.ready = value; },
    setAnalysisItems: value => { state.items = value; }, setAnalysisTime: () => {},
    setIsAnalyzing: value => { state.analyzing = value; },
    setDetalleResultados: value => { state.details = value; },
    setActiveResultIndex: () => {}, setSelectedHallazgoId: () => {}, setDetailError: () => {}, setIsDetailLoading: () => {},
    sessionStorage: storage({ eval_confirmedResults: JSON.stringify(state.receipt), eval_analysisItems: '[{"status":"completed"}]' }),
    localStorage: storage({ eval_pausas: JSON.stringify({
      12: { currentStep: 5, isAnalyzing: true, analysisItems: [{ status: 'completed' }], finalDiagnosis: 'Borrador ficticio' },
      99: { currentStep: 4, finalDiagnosis: 'Otra evaluación' },
    }) }),
  };
  context.invalidateConfirmedAnalysis = () => {
    state.invalidations++;
    controller('invalidateConfirmedAnalysis', context, false)();
    state.receipt = context.receiptRef.current;
  };
  return { state, context, save: () => controller('handleNext', context)() };
}

test('reemplazo confirmado invalida el recibo anterior y permite iniciar otra detección explícita', async () => {
  const { state, save } = fixture();
  await save();
  assert.equal(state.receipt, null);
  assert.equal(state.ready, false);
  assert.equal(state.invalidations, 1);
  assert.equal(state.step, 4);
  assert.equal(state.requests.length, 1);
  assert.ok(state.requests.every(request => request.url.endsWith('/radiografias')));
});

test('cancelar selección de archivo no invalida el recibo ni cambia resultados', async () => {
  const { state, context } = fixture([stored(21)]);
  const before = state.receipt;
  const body = page.split('const handleFileChange = async (id, e) => {')[1].split('\n  };')[0];
  const fileChange = new Function('validateSelectedFile', `return async (id, e) => {${body}}`)(
    async (_id, file) => { assert.equal(file, undefined); });
  await fileChange(21, { target: { files: [], value: '' } });
  assert.equal(context.receiptRef.current, before);
  assert.equal(state.invalidations, 0);
});

test('guardar reemplazo fallido conserva recibo y resultados válidos anteriores', async () => {
  const { state, context, save } = fixture([replacement(21)], false);
  const before = state.receipt;
  await save();
  assert.equal(context.receiptRef.current, before);
  assert.equal(state.ready, true);
  assert.deepEqual(state.details.detecciones, ['antigua']);
  assert.equal(state.invalidations, 0);
  assert.equal(state.step, 3);
});

test('guardar el mismo conjunto sin subir archivos conserva reintento de detalle', async () => {
  const { state, context, save } = fixture([stored(21)]);
  const before = state.receipt;
  await save();
  assert.equal(context.receiptRef.current, before);
  assert.equal(state.ready, true);
  assert.equal(state.invalidations, 0);
});

test('recarga después del reemplazo no puede recuperar el recibo ni los items anteriores', async () => {
  const { state, context, save } = fixture();
  await save();
  assert.equal(context.sessionStorage.getItem('eval_confirmedResults'), null);
  assert.equal(context.sessionStorage.getItem('eval_analysisItems'), null);
  const pauses = JSON.parse(context.localStorage.getItem('eval_pausas'));
  assert.equal(pauses[12].currentStep, 4);
  assert.equal(pauses[12].isAnalyzing, false);
  assert.deepEqual(pauses[12].analysisItems, []);
  assert.equal(pauses[12].finalDiagnosis, 'Borrador ficticio');
  assert.equal(pauses[99].finalDiagnosis, 'Otra evaluación');
  assert.deepEqual(state.details, { radiografias: [], detecciones: [] });
});

test('lote: reemplazar una, agregar o retirar una radiografía invalida todo el recibo del lote', async () => {
  for (const rows of [[replacement(21), stored(22)], [stored(21), stored(22)], []]) {
    // Retirar una imagen se guarda manteniendo al menos otra imagen del lote.
    const actualRows = rows.length ? rows : [stored(21)];
    const { state, context, save } = fixture(actualRows);
    if (!rows.length) context.receiptRef.current.results.push({ id_radiografia: 22, id_resultado: 32 });
    await save();
    assert.equal(state.invalidations, 1);
    assert.equal(context.receiptRef.current, null);
  }
});

test('respuesta tardía de YOLO anterior no restaura recibo aunque el transporte ignore cancelación', async () => {
  const { state, context } = fixture([replacement(21)]);
  let release;
  context.authenticatedFetch = () => new Promise(resolve => { release = resolve; });
  context.startAnalysisTiming = options => ({
    cancel() {}, // Simula un transporte que ignora abort: la generación debe protegerlo.
    result: options.request({ aborted: false }),
  });
  context.assertAnalysisResults = assertAnalysisResults;
  context.analysisReceipt = analysisReceipt;
  context.clearAnalysisPersistence = () => { throw new Error('Una respuesta obsoleta no debe limpiar el intento actual'); };
  const pending = controller('startAnalysis', context)();
  context.invalidateConfirmedAnalysis();
  release({ ok: true, json: async () => ({ resultados: [{ id_radiografia: 21, resultado: { status: 'success', id_resultado: 31 } }] }) });
  await pending;
  assert.equal(context.receiptRef.current, null);
  assert.equal(context.sessionStorage.getItem('eval_confirmedResults'), null);
  assert.equal(state.ready, false);
  assert.equal(state.analyzing, false);
});
