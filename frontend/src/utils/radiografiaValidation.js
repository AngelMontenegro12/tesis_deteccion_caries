const EXTENSIONS = /\.(jpe?g|png|bmp|tiff?|webp|gif)$/i;

export async function validateRadiografia(file, { signal, fetchImpl = fetch, timeoutMs = 60000 } = {}) {
  if (!file || !EXTENSIONS.test(file.name || '') || !(file.type || '').startsWith('image/')) {
    return { status: 'rejected', message: 'Formato no permitido. Selecciona una imagen radiográfica válida.' };
  }
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener('abort', abort, { once: true });
  if (signal?.aborted) controller.abort();
  const timeout = setTimeout(abort, timeoutMs);
  try {
    const body = new FormData();
    body.append('file', file);
    const response = await fetchImpl('http://localhost:8000/api/validate', {
      method: 'POST', body, signal: controller.signal,
    });
    if (!response.ok) {
      return { status: 'unavailable', message: `No se pudo validar la imagen (HTTP ${response.status}). El servicio de validación no está disponible; vuelve a intentarlo.` };
    }
    const data = await response.json();
    if (data?.valid === false) {
      const message = typeof data.error === 'string' ? data.error : typeof data.message === 'string' ? data.message : '';
      return { status: 'rejected', message: message || 'La imagen no es una radiografía panorámica válida.' };
    }
    if (data?.valid !== true || (data.error != null && data.error !== '') || data.status === 'error' || data.status === 'unavailable') {
      return { status: 'unavailable', message: 'El servicio no confirmó la validez de la imagen. Vuelve a intentarlo.' };
    }
    return { status: 'valid', message: '' };
  } catch {
    return { status: 'unavailable', message: 'No se pudo completar la validación por conexión, tiempo de espera o respuesta inesperada. Vuelve a intentarlo.' };
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', abort);
  }
}

export function createValidationRequests(validate = validateRadiografia) {
  const pending = new Map();
  return {
    begin(id, file) {
      pending.get(id)?.controller.abort();
      const token = { controller: new AbortController(), file };
      pending.set(id, token);
      const current = () => pending.get(id) === token;
      return { current, result: validate(file, { signal: token.controller.signal }) };
    },
    cancel(id) { pending.get(id)?.controller.abort(); pending.delete(id); },
    clear() { pending.forEach(token => token.controller.abort()); pending.clear(); },
  };
}

export function allRadiografiasValidated(rows) {
  return rows.length > 0 && rows.every(row => row.tipo === '1' && (
    (row.validationStatus === 'valid' && row.file && row.validatedFile === row.file) ||
    (row.validationStatus === 'stored' && row.id_bd && !row.file)
  ));
}
