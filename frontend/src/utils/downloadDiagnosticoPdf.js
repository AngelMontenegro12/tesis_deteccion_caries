import api from '../services/api';

export const downloadDiagnosticoPdf = async (evaluationId) => {
  try {
    const response = await api.get(`/evaluaciones/${evaluationId}/pdf`, { responseType: 'blob' });
    if (response.data.type && !response.data.type.includes('pdf')) {
      throw new Error('La respuesta recibida no es un PDF válido.');
    }

    const url = URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = url;
    const disposition = response.headers['content-disposition'] || '';
    const encodedName = disposition.match(/filename\*=UTF-8''([^;]+)/i);
    const plainName = disposition.match(/filename="?([^";]+)"?/i);
    link.download = encodedName
      ? decodeURIComponent(encodedName[1])
      : plainName?.[1] || 'diagnostico_Paciente.pdf';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (error) {
    if (error.response?.data instanceof Blob) {
      try {
        const details = JSON.parse(await error.response.data.text());
        throw new Error(details.error || details.message || 'No se pudo descargar el PDF.');
      } catch (parseError) {
        if (parseError instanceof SyntaxError) throw new Error('No se pudo descargar el PDF.');
        throw parseError;
      }
    }
    throw error;
  }
};
