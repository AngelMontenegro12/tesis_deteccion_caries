// Solo una confirmación del servidor identifica resultados del intento actual.
export function analysisReceipt(data, evaluacionId) {
  if (!Array.isArray(data?.resultados) || !data.resultados.length) throw new Error('No se confirmó el lote de resultados.');
  const results = data.resultados.map(row => ({
    id_radiografia: row.id_radiografia, id_resultado: row.resultado?.id_resultado,
  }));
  if (results.some(row => !row.id_radiografia || !row.id_resultado)
      || new Set(results.map(row => String(row.id_radiografia))).size !== results.length) {
    throw new Error('No se confirmó la identidad de todos los resultados.');
  }
  return { evaluacionId, results };
}

export function assertResultDetails(data, receipt) {
  const fail = () => { throw new Error('El detalle no corresponde al análisis confirmado o está incompleto. No se mostrarán resultados antiguos.'); };
  if (!receipt?.results?.length || String(data?.evaluacion?.id_evaluacion) !== String(receipt.evaluacionId)
      || !Array.isArray(data.radiografias) || !Array.isArray(data.detecciones_caries)
      || data.radiografias.length !== receipt.results.length) fail();
  const expected = new Map(receipt.results.map(row => [String(row.id_radiografia), String(row.id_resultado)]));
  const seen = new Set();
  for (const row of data.radiografias) {
    const id = String(row.id_radiografia);
    if (seen.has(id) || row.estado_procesado !== 'completado' || !row.id_resultado
        || expected.get(id) !== String(row.id_resultado)) fail();
    seen.add(id);
  }
  const resultIds = new Set(expected.values());
  for (const det of data.detecciones_caries) {
    if (!det || !resultIds.has(String(det.id_resultado)) || !det.id_deteccion
        || !['bbox_x', 'bbox_y', 'bbox_ancho', 'bbox_alto'].every(key => typeof det[key] === 'number' && Number.isFinite(det[key]))) fail();
  }
  return { radiografias: data.radiografias, detecciones: data.detecciones_caries };
}

export function createDetailLoader(fetchImpl) {
  let generation = 0;
  let active;
  const cancel = () => { generation++; active?.abort(); };
  return {
    cancel,
    async load(receipt) {
      cancel();
      const current = generation;
      const controller = new AbortController();
      active = controller;
      const timeout = setTimeout(() => controller.abort(), 20000);
      try {
        const response = await fetchImpl(`http://localhost:5000/api/evaluaciones/${receipt.evaluacionId}/detalle`, { signal: controller.signal });
        if (!response.ok) throw new Error(`No se pudo cargar el detalle (HTTP ${response.status}). Reintenta sin ejecutar de nuevo la IA.`);
        const data = await response.json();
        if (current !== generation) throw new Error('Consulta de detalle reemplazada.');
        return assertResultDetails(data, receipt);
      } catch (error) {
        if (error.name === 'AbortError' || error instanceof TypeError || error instanceof SyntaxError) {
          throw new Error('No se pudo recuperar el detalle por conexión, tiempo de espera o respuesta inesperada. Reintenta la carga sin ejecutar de nuevo la IA.');
        }
        throw error;
      } finally {
        clearTimeout(timeout);
      }
    },
  };
}
