// Coordinación visual únicamente: no altera la inferencia, sus parámetros ni la persistencia.
export function startAnalysisTiming({ request, random = Math.random, clock = globalThis,
  onSecond = () => {}, onVisual = () => {} }) {
  const minimumMs = 2000 + Math.floor(random() * 1001);
  const controller = new AbortController();
  const started = clock.Date ? clock.Date.now() : Date.now();
  const elapsed = () => (clock.Date ? clock.Date.now() : Date.now()) - started;
  const timers = [];
  let stopped = false;
  const cleanup = () => {
    stopped = true;
    timers.forEach(([kind, id]) => clock[kind](id));
  };
  const minimum = new Promise(resolve => {
    timers.push(['clearTimeout', clock.setTimeout(resolve, minimumMs)]);
  });
  timers.push(['clearInterval', clock.setInterval(() => {
    if (!stopped) onSecond(Math.floor(elapsed() / 1000));
  }, 1000)]);
  timers.push(['clearInterval', clock.setInterval(() => {
    if (!stopped) onVisual(elapsed(), minimumMs);
  }, 80)]);
  let rejectCancellation;
  const cancellation = new Promise((_, reject) => { rejectCancellation = reject; });
  const cancel = () => {
    if (stopped) return;
    cleanup();
    controller.abort();
    const error = new Error('Procesamiento cancelado');
    error.name = 'AbortError';
    rejectCancellation(error);
  };
  timers.push(['clearTimeout', clock.setTimeout(() => {
    if (stopped) return;
    controller.abort();
    rejectCancellation(new Error('El procesamiento superó el tiempo de espera. Inténtalo de nuevo.'));
  }, 120000)]);
  // request empieza ahora, no después del mínimo visual. Incluye leer/verificar el cuerpo.
  const backend = (async () => request(controller.signal))();
  const result = Promise.race([
    Promise.all([backend, minimum]).then(([data]) => data), cancellation,
  ]).then(data => {
    onSecond(Math.floor(elapsed() / 1000));
    cleanup();
    return data;
  }, error => { cleanup(); throw error; });
  return { minimumMs, result, cancel };
}

export function assertAnalysisResults(data, expectedIds) {
  const invalid = value => value && (
    value.validation === false || value.validacion === false || value.valid === false ||
    value.is_radiograph === false || value.any_invalid_images === true || value.image_valid === false ||
    value.status === 'invalid_image' || value.status === 'error'
  );
  const fail = value => {
    const error = new Error(value?.message || value?.error || 'No se pudo procesar la evaluación');
    error.invalidImage = value?.status === 'invalid_image' || value?.valid === false;
    throw error;
  };
  if (invalid(data)) fail(data);
  if (!Array.isArray(data?.resultados) || data.resultados.length !== expectedIds.length) {
    throw new Error('No se recibieron los resultados de todas las radiografías.');
  }
  const received = new Set();
  for (const entry of data.resultados) {
    const inner = entry?.resultado || entry?.result || entry;
    if (invalid(inner)) fail(inner);
    if (inner?.status !== 'success') throw new Error('Hay radiografías sin procesamiento finalizado.');
    received.add(String(entry.id_radiografia));
  }
  if (received.size !== expectedIds.length || expectedIds.some(id => id != null && !received.has(String(id)))) {
    throw new Error('Los resultados no corresponden a todas las radiografías solicitadas.');
  }
  return data;
}
