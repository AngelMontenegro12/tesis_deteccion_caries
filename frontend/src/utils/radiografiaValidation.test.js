import test from 'node:test';
import assert from 'node:assert/strict';
import { validateRadiografia, createValidationRequests, allRadiografiasValidated } from './radiografiaValidation.js';

const image = () => new File(['imagen-ficticia'], 'demo.png', { type: 'image/png' });
const response = (data, status = 200) => new Response(JSON.stringify(data), { status });
const row = (file, status = 'valid') => ({ tipo: '1', file, validatedFile: file, validationStatus: status });

test('respuesta explícita válida habilita continuar; TXT se rechaza antes de la red', async () => {
  const file = image();
  const result = await validateRadiografia(file, { fetchImpl: async () => response({ valid: true, error: null }) });
  assert.equal(result.status, 'valid');
  assert.equal(allRadiografiasValidated([row(file, result.status)]), true);
  const txt = new File(['texto'], 'demo.txt', { type: 'text/plain' });
  const rejected = await validateRadiografia(txt, { fetchImpl: () => { throw new Error('No debe consultar red'); } });
  assert.equal(rejected.status, 'rejected');
  assert.equal(allRadiografiasValidated([row(txt, rejected.status)]), false);
});

test('corrupta y no panorámica: conservar motivo de rechazo sin continuar', async () => {
  for (const reason of ['Imagen corrupta', 'Imagen vertical; debe ser panorámica']) {
    const result = await validateRadiografia(image(), { fetchImpl: async () => response({ valid: false, error: reason }) });
    assert.equal(result.status, 'rejected');
    assert.equal(result.message, reason);
    assert.equal(allRadiografiasValidated([row(image(), result.status)]), false);
  }
});

test('HTTP 400/500 y respuestas inesperadas nunca confirman validez', async () => {
  for (const result of [response({ valid: true }, 400), response({ valid: true }, 500),
    response({}), response({ valid: 'true' }), response({ valid: 1 }), response(null),
    response({ valid: true, error: 'fallo' }), new Response('JSON corrupto')]) {
    const validation = await validateRadiografia(image(), { fetchImpl: async () => result });
    assert.equal(validation.status, 'unavailable');
    assert.equal(allRadiografiasValidated([row(image(), validation.status)]), false);
  }
});

test('desconexión y timeout: indisponible y continuar bloqueado', async () => {
  const disconnected = await validateRadiografia(image(), { fetchImpl: async () => { throw new TypeError('fallo ficticio'); } });
  assert.equal(disconnected.status, 'unavailable');
  const timeout = await validateRadiografia(image(), { timeoutMs: 1, fetchImpl: (_url, { signal }) =>
    new Promise((_, reject) => signal.addEventListener('abort', () => reject(new Error('timeout simulado')))) });
  assert.equal(timeout.status, 'unavailable');
  assert.equal(allRadiografiasValidated([row(image(), timeout.status)]), false);
});

test('cambio de archivo: descartar respuesta antigua, incluso si ignora abort', async () => {
  const pending = [];
  const requests = createValidationRequests((file, { signal }) => new Promise(resolve => pending.push({ file, signal, resolve })));
  const first = requests.begin(1, image());
  const secondFile = image();
  const second = requests.begin(1, secondFile);
  assert.equal(pending[0].signal.aborted, true);
  pending[1].resolve({ status: 'rejected' });
  assert.equal((await second.result).status, 'rejected');
  pending[0].resolve({ status: 'valid' });
  await first.result;
  assert.equal(first.current(), false);
  assert.equal(second.current(), true);
  requests.cancel(1);
  assert.equal(second.current(), false);
});

test('lotes, reintento y restauración: solo archivos actuales confirmados o existentes sin cambio', async () => {
  const a = image();
  const b = image();
  assert.equal(allRadiografiasValidated([row(a), row(b, 'validating')]), false);
  assert.equal(allRadiografiasValidated([row(a), row(b, 'unavailable')]), false);
  const result = await validateRadiografia(b, { fetchImpl: async () => response({ valid: true }) });
  assert.equal(allRadiografiasValidated([row(a), row(b, result.status)]), true);
  assert.equal(allRadiografiasValidated([{ ...row(a), file: b }]), false);
  assert.equal(allRadiografiasValidated([{ tipo: '1', preview: 'data:image/png;...', validationStatus: 'unvalidated' }]), false);
  assert.equal(allRadiografiasValidated([{ tipo: '1', id_bd: 12, validationStatus: 'stored' }]), true);
  assert.equal(allRadiografiasValidated([]), false);
  assert.equal(allRadiografiasValidated([{ ...row(a), tipo: '2' }]), false);
});
