import { authenticatedFetch } from './api.js';

export async function updatePatientWithConfirmation(url, data) {
  const send = (payload) => authenticatedFetch(url, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
  });
  const response = await send(data);
  if (response.status !== 409) return response;
  const details = await response.clone().json().catch(() => ({}));
  if (details.code !== 'CONFIRMAR_IDENTIDAD') return response;
  if (!window.confirm(`Se modificarán estos campos de identidad: ${details.campos.join(', ')}. Los expedientes finalizados conservarán los datos anteriores. ¿Deseas continuar?`)) {
    return response;
  }
  const motivo = window.prompt('Indica el motivo de la rectificación (máximo 500 caracteres, sin datos sensibles):');
  if (!motivo?.trim()) return response;
  return send({ ...data, confirmar_identidad: true, motivo_rectificacion: motivo.trim() });
}
