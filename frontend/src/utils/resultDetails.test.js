import test from 'node:test';
import assert from 'node:assert/strict';
import { analysisReceipt, assertResultDetails, createDetailLoader } from './resultDetails.js';

const receipt = { evaluacionId: 12, results: [{ id_radiografia: 21, id_resultado: 31 }] };
const detail = () => ({ evaluacion: { id_evaluacion: 12 }, radiografias: [
  { id_radiografia: 21, id_resultado: 31, estado_procesado: 'completado' },
], detecciones_caries: [] });
const response = data => ({ ok: true, json: async () => data });

test('detalle HTTP 500 y conexión fallida no son resultados vacíos', async () => {
  for (const fetchImpl of [async () => ({ ok: false, status: 500 }), async () => { throw new TypeError('Failed to fetch'); }]) {
    const loader = createDetailLoader(fetchImpl);
    await assert.rejects(loader.load(receipt), /detalle/);
  }
});

test('reintentar solo detalle después del fallo; no solicita procesar ni YOLO', async () => {
  const urls = [];
  const loader = createDetailLoader(async url => {
    urls.push(url);
    return urls.length === 1 ? { ok: false, status: 500 } : response(detail());
  });
  await assert.rejects(loader.load(receipt));
  const result = await loader.load(receipt);
  assert.deepEqual(result.detecciones, []); // Vacío genuino y confirmado.
  assert.equal(urls.length, 2);
  assert.ok(urls.every(url => url.endsWith('/12/detalle')));
});

test('datos incompletos, antiguos o de otro paciente no permiten abrir resultados', () => {
  for (const data of [{}, { ...detail(), detecciones_caries: null },
    { ...detail(), evaluacion: { id_evaluacion: 99 } },
    { ...detail(), radiografias: [] },
    { ...detail(), radiografias: [{ id_radiografia: 21, id_resultado: 30, estado_procesado: 'completado' }] },
    { ...detail(), radiografias: [{ id_radiografia: 21, id_resultado: 31, estado_procesado: 'pendiente' }] },
    { ...detail(), detecciones_caries: [{ id_resultado: 30 }] }]) {
    assert.throws(() => assertResultDetails(data, receipt));
  }
});

test('una respuesta tardía no puede reemplazar el detalle del intento actual', async () => {
  let release;
  let calls = 0;
  const loader = createDetailLoader(async () => ++calls === 1 ? new Promise(resolve => { release = resolve; }) : response(detail()));
  const old = loader.load(receipt);
  const outcome = assert.rejects(old, /reemplazada/);
  await loader.load(receipt);
  release(response(detail()));
  await outcome;
});

test('recarga: recibo persistido solo se recupera con confirmación actual del backend', async () => {
  const stored = JSON.parse(JSON.stringify(receipt));
  let consulted = 0;
  const loader = createDetailLoader(async () => { consulted++; return response(detail()); });
  assert.equal((await loader.load(stored)).radiografias.length, 1);
  assert.equal(consulted, 1);
  await assert.rejects(createDetailLoader(async () => response({ ...detail(), radiografias: [] })).load(stored));
  assert.throws(() => assertResultDetails(detail(), null)); // Sin recibo no asumir éxito anterior.
});

test('solo el lote confirmado genera un recibo recuperable', () => {
  assert.deepEqual(analysisReceipt({ resultados: [{ id_radiografia: 21, resultado: { id_resultado: 31 } }] }, 12), receipt);
  assert.throws(() => analysisReceipt({ resultados: [{ id_radiografia: 21, resultado: {} }] }, 12));
  assert.throws(() => analysisReceipt({ resultados: [] }, 12));
});
