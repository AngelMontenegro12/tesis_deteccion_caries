import assert from 'node:assert/strict';
import test from 'node:test';
import { startAnalysisTiming, assertAnalysisResults } from './analysisTiming.js';

// Reloj simulado: ninguna petición HTTP, IA, archivo clínico o espera real.
function fakeClock() {
  let now = 0;
  let next = 0;
  const tasks = new Map();
  const schedule = (fn, ms, interval = 0) => {
    const id = ++next;
    tasks.set(id, { fn, due: now + ms, interval });
    return id;
  };
  return {
    Date: { now: () => now },
    setTimeout: (fn, ms) => schedule(fn, ms),
    clearTimeout: id => tasks.delete(id),
    setInterval: (fn, ms) => schedule(fn, ms, ms),
    clearInterval: id => tasks.delete(id),
    pending: () => tasks.size,
    advance(ms) {
      const end = now + ms;
      while (true) {
        const due = [...tasks].filter(([, task]) => task.due <= end)
          .sort((a, b) => a[1].due - b[1].due || a[0] - b[0])[0];
        if (!due) break;
        const [id, task] = due;
        now = task.due;
        if (task.interval) task.due += task.interval;
        else tasks.delete(id);
        task.fn();
      }
      now = end;
    },
  };
}
const flush = async () => { for (let i = 0; i < 15; i++) await Promise.resolve(); };
const entry = (id, status = 'success') => ({ id_radiografia: id, resultado: { status } });

function scenario(duration, random = () => 0.5, error = false) {
  const clock = fakeClock();
  let readyAt = null;
  let failure;
  const run = startAnalysisTiming({ clock, random,
    request: () => new Promise((resolve, reject) => clock.setTimeout(() => {
      if (error) reject(new Error('Error de IA simulado'));
      else resolve(assertAnalysisResults({ resultados: [entry(11)] }, [11]));
    }, duration)),
  });
  run.result.then(() => { readyAt = clock.Date.now(); }, reason => { failure = reason; });
  return { clock, run, readyAt: () => readyAt, failure: () => failure };
}

for (const duration of [500, 2000, 5000]) {
  test(`IA ${duration} ms: resultados disponibles en max(IA, mínimo visual), no suma de tiempos`, async () => {
    const state = scenario(duration);
    const expected = Math.max(duration, state.run.minimumMs);
    assert.equal(state.run.minimumMs, 2500);
    state.clock.advance(expected - 1);
    await flush();
    assert.equal(state.readyAt(), null);
    state.clock.advance(1);
    await flush();
    assert.equal(state.readyAt(), expected);
    assert.equal(state.clock.pending(), 0);
  });
}

test('mínimo aleatorio acotado entre 2000 y 3000 ms', async () => {
  for (const [random, expected] of [[() => 0, 2000], [() => 0.999999, 3000]]) {
    const state = scenario(500, random);
    assert.equal(state.run.minimumMs, expected);
    state.clock.advance(expected);
    await flush();
    assert.equal(state.readyAt(), expected);
  }
});

test('error temprano: nunca habilita resultados ni conserva temporizadores', async () => {
  const state = scenario(500, () => 0.5, true);
  state.clock.advance(500);
  await flush();
  assert.match(state.failure().message, /Error de IA/);
  assert.equal(state.clock.pending(), 0);
  state.clock.advance(10000);
  await flush();
  assert.equal(state.readyAt(), null);
});

test('nuevo procesamiento: cancelar el anterior limpia timers y descarta su respuesta tardía', async () => {
  const clock = fakeClock();
  let staleReady = false;
  let oldSignal;
  let visuals = 0;
  const first = startAnalysisTiming({ clock, onVisual: () => visuals++, request: signal => {
    oldSignal = signal;
    return new Promise(resolve => clock.setTimeout(resolve, 5000));
  } });
  first.result.then(() => { staleReady = true; }, () => {});
  clock.advance(1000);
  first.cancel();
  await flush();
  const oldVisuals = visuals;
  assert.equal(oldSignal.aborted, true);
  let freshReadyAt;
  const seconds = [];
  const second = startAnalysisTiming({ clock, random: () => 0, onSecond: s => seconds.push(s),
    request: () => Promise.resolve({ resultados: [entry(12)] }) });
  second.result.then(() => { freshReadyAt = clock.Date.now(); });
  clock.advance(2000);
  await flush();
  assert.equal(freshReadyAt, 3000); // 2000 ms desde el nuevo clic.
  assert.deepEqual(seconds, [1, 2, 2]);
  clock.advance(5000);
  await flush();
  assert.equal(staleReady, false);
  assert.equal(visuals, oldVisuals);
  assert.equal(clock.pending(), 0);
});

test('varias radiografías: esperar todas, sin multiplicar el mínimo por el lote', async () => {
  const clock = fakeClock();
  let readyAt;
  const run = startAnalysisTiming({ clock, random: () => 0.5, request: async () => {
    const results = await Promise.all([500, 5000].map((delay, index) =>
      new Promise(resolve => clock.setTimeout(() => resolve(entry(11 + index)), delay))));
    return assertAnalysisResults({ resultados: results }, [11, 12]);
  } });
  run.result.then(() => { readyAt = clock.Date.now(); });
  clock.advance(4999);
  await flush();
  assert.equal(readyAt, undefined);
  clock.advance(1);
  await flush();
  assert.equal(readyAt, 5000);
  assert.equal(clock.pending(), 0);
});

test('lote con error, pendiente, faltante o duplicado: no habilita resultados', async () => {
  const cases = [
    { resultados: [entry(11), entry(12, 'error')] },
    { resultados: [entry(11), entry(12, 'pendiente')] },
    { resultados: [entry(11)] },
    { resultados: [entry(11), entry(11)] },
    { resultados: [entry(11), entry(99)] }, {},
  ];
  for (const data of cases) {
    const clock = fakeClock();
    let ready = false;
    let failed = false;
    const run = startAnalysisTiming({ clock, request: async () => assertAnalysisResults(data, [11, 12]) });
    run.result.then(() => { ready = true; }, () => { failed = true; });
    await flush();
    clock.advance(10000);
    await flush();
    assert.equal(ready, false);
    assert.equal(failed, true);
    assert.equal(clock.pending(), 0);
  }
});

test('timeout conserva límite previo de 120 s y limpia todos los temporizadores', async () => {
  const clock = fakeClock();
  let signal;
  const run = startAnalysisTiming({ clock, request: s => { signal = s; return new Promise(() => {}); } });
  const failure = run.result.catch(error => error);
  clock.advance(120000);
  await flush();
  assert.match((await failure).message, /tiempo de espera/);
  assert.equal(signal.aborted, true);
  assert.equal(clock.pending(), 0);
});
