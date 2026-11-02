// Ejecuta los controladores reales extraídos de la página sin montar el DOM.
// No sustituye la comprobación visual en navegador.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createDetailLoader } from './resultDetails.js';

const page = readFileSync(new URL('../pages/EvaluacionClinica.jsx', import.meta.url), 'utf8');
const receipt = { evaluacionId: 12, results: [{ id_radiografia: 21, id_resultado: 31 }] };
const valid = { evaluacion: { id_evaluacion: 12 }, radiografias: [
  { id_radiografia: 21, id_resultado: 31, estado_procesado: 'completado' },
], detecciones_caries: [] };

function controller(name, context) {
  const body = page.split(`const ${name} = async () => {`)[1].split('\n  };')[0];
  return new Function(...Object.keys(context), `return async () => {${body}}`)(...Object.values(context));
}

function fixture(fetchImpl) {
  const state = { step: 4, detail: { radiografias: ['dato-antiguo'], detecciones: ['dato-antiguo'] }, error: '', loading: false };
  const context = {
    evaluacionId: 12, receiptRef: { current: receipt }, detailRequestRef: { current: 0 },
    detailLoaderRef: { current: createDetailLoader(fetchImpl) },
    setDetalleResultados: value => { state.detail = value; },
    setDetailError: value => { state.error = value; },
    setIsDetailLoading: value => { state.loading = value; },
  };
  const load = controller('obtenerDetalleResultados', context);
  const open = controller('abrirResultados', {
    receiptRef: context.receiptRef,
    obtenerDetalleResultados: load, setIsAnalyzing: () => {},
    setCurrentStep: value => { state.step = value; },
  });
  return { state, open };
}

test('Continuar con paciente existente sin evaluación pendiente avanza al contexto clínico', async () => {
  let step = 1;
  const next = controller('handleNext', {
    currentStep: 1, patientMode: 'search', selectedPatient: { id_paciente: 1 },
    evaluacionId: null, setCurrentStep: value => { step = value; },
  });
  await next();
  assert.equal(step, 2);
});

test('Continuar sin paciente no avanza ni permite saltar resultados sin confirmar', async () => {
  for (const currentStep of [1, 4]) {
    let step = currentStep;
    const next = controller('handleNext', {
      currentStep, patientMode: 'search', selectedPatient: null, analysisResultsReady: false,
      setCurrentStep: value => { step = value; },
    });
    await next();
    assert.equal(step, currentStep);
  }
});

test('controlador real: HTTP 500 o desconexión limpia datos anteriores y no avanza al paso 5', async () => {
  for (const fetchImpl of [async () => ({ ok: false, status: 500 }), async () => { throw new TypeError('fallo simulado'); }]) {
    const { state, open } = fixture(fetchImpl);
    await open();
    assert.equal(state.step, 4);
    assert.deepEqual(state.detail, { radiografias: [], detecciones: [] });
    assert.match(state.error, /detalle/);
    assert.equal(state.loading, false);
  }
});

test('controlador real: reintentar detalle abre paso 5 solo con datos actuales', async () => {
  let calls = 0;
  const { state, open } = fixture(async url => {
    assert.ok(url.endsWith('/detalle'));
    return ++calls === 1 ? { ok: false, status: 500 } : { ok: true, json: async () => valid };
  });
  await open();
  assert.equal(state.step, 4);
  await open();
  assert.equal(state.step, 5);
  assert.deepEqual(state.detail.radiografias, valid.radiografias);
  assert.equal(calls, 2);
});

test('efecto real de recarga: sin recibo consulta backend y avisa sin restaurar modal activo', async () => {
  const marker = '// Recuperación conservadora:';
  const body = page.split(marker)[1].split('useEffect(() => {')[1].split('\n  }, [evaluacionId')[0];
  const state = { notice: '', queried: 0, modal: false, ready: false };
  const context = {
    evaluacionId: 12, currentStep: 4, analysisRunRef: { current: null },
    receiptRef: { current: null }, interruptedRef: { current: true },
    setDetailError: value => { state.notice = value; },
    authenticatedFetch: async url => {
      assert.ok(url.endsWith('/detalle'));
      state.queried++;
      return { ok: true, json: async () => ({ evaluacion: { estado: 'pendiente' } }) };
    },
    obtenerDetalleResultados: async () => { throw new Error('Sin recibo no cargar resultados'); },
    setAnalysisResultsReady: value => { state.ready = value; },
    setAnalysisItems: () => {}, setIsAnalyzing: value => { state.modal = value; },
  };
  new Function(...Object.keys(context), body)(...Object.values(context));
  for (let i = 0; i < 10; i++) await Promise.resolve();
  assert.equal(state.queried, 1);
  assert.match(state.notice, /interrumpió/);
  assert.equal(state.modal, false);
  assert.equal(state.ready, false);
});

test('efecto real de recarga: con recibo no declara éxito hasta verificar detalle', async () => {
  const body = page.split('// Recuperación conservadora:')[1].split('useEffect(() => {')[1].split('\n  }, [evaluacionId')[0];
  for (const confirmed of [false, true]) {
    const state = { modal: false, ready: false, queries: 0 };
    const context = {
      evaluacionId: 12, currentStep: 4, analysisRunRef: { current: null },
      receiptRef: { current: receipt }, interruptedRef: { current: true },
      obtenerDetalleResultados: async () => { state.queries++; return confirmed; },
      setAnalysisResultsReady: value => { state.ready = value; },
      setAnalysisItems: () => {}, setIsAnalyzing: value => { state.modal = value; },
    };
    new Function(...Object.keys(context), body)(...Object.values(context));
    assert.equal(state.ready, false);
    for (let i = 0; i < 10; i++) await Promise.resolve();
    assert.equal(state.queries, 1);
    assert.equal(state.ready, confirmed);
    assert.equal(state.modal, confirmed);
  }
});
