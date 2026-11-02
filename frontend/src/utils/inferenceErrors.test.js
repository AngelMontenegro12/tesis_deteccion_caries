import assert from 'node:assert/strict';
import test from 'node:test';
import { startAnalysisTiming, assertAnalysisResults } from './analysisTiming.js';

// No red ni esperas reales: ejercita el coordinador H08 con el contrato de H04.
function clock() {
  const tasks = new Map();
  let id = 0;
  return {
    Date: { now: () => 2500 },
    setTimeout(fn, ms) { tasks.set(++id, { fn, ms }); return id; },
    clearTimeout(key) { tasks.delete(key); },
    setInterval() { return ++id; }, clearInterval() {},
    finishMinimum() { for (const [key, task] of tasks) if (task.ms <= 3000) { tasks.delete(key); task.fn(); } },
  };
}

function processingResponse(status, data) {
  return { ok: status === 200, json: async () => data };
}

async function runResponse(response, timer) {
  return startAnalysisTiming({ clock: timer, random: () => 0.5, request: async () => {
    // Mismo control HTTP y de lote que utiliza startAnalysis en la página.
    if (!response.ok) {
      const details = await response.json();
      throw new Error(details.error || 'No se pudo procesar la evaluación');
    }
    return assertAnalysisResults(await response.json(), [12, 13]);
  } });
}

const success = id => ({ id_radiografia: id, resultado: { status: 'success', detections: [] } });

test('H04: HTTP de fallo nunca habilita resultados aunque termine el mínimo H08', async () => {
  for (const status of [500, 502, 503, 504]) {
    const timer = clock();
    let ready = false;
    const run = await runResponse(processingResponse(status, { status: 'error', error: 'Análisis no completado' }), timer);
    const outcome = run.result.then(() => { ready = true; }, error => error);
    timer.finishMinimum();
    assert.match((await outcome).message, /no completado/);
    assert.equal(ready, false);
  }
});

test('H04: lote parcial fallido no permite ver resultados y el reintento válido sí', async () => {
  const timer = clock();
  const failed = await runResponse(processingResponse(200, {
    resultados: [success(12), { id_radiografia: 13, resultado: { status: 'error' } }],
  }), timer);
  await assert.rejects(failed.result);
  const retry = await runResponse(processingResponse(200, { resultados: [success(12), success(13)] }), timer);
  assert.equal(retry.minimumMs, 2500);
  let ready = false;
  const outcome = retry.result.then(() => { ready = true; });
  await Promise.resolve();
  assert.equal(ready, false);
  timer.finishMinimum();
  await outcome;
  assert.equal(ready, true);
});
