import assert from 'node:assert/strict';
import test from 'node:test';
import { updatePatientWithConfirmation } from './patients.js';

globalThis.localStorage = { getItem: () => JSON.stringify({ token: 'fixture-token' }) };
globalThis.window = new EventTarget();
const endpoint = 'http://localhost:5000/api/pacientes/12';

test('contacto: una solicitud sin confirmación ni datos extras', async () => {
  const previousFetch = globalThis.fetch;
  let calls = 0;
  window.confirm = () => { throw new Error('No debe pedir confirmación'); };
  globalThis.fetch = async (_url, options) => {
    calls++;
    assert.deepEqual(JSON.parse(options.body), { telefono: '900000002' });
    assert.equal(options.headers.get('Authorization'), 'Bearer fixture-token');
    return new Response('{}', { status: 200 });
  };
  try {
    assert.equal((await updatePatientWithConfirmation(endpoint, { telefono: '900000002' })).status, 200);
    assert.equal(calls, 1);
  } finally { globalThis.fetch = previousFetch; }
});

test('identidad: solo reintenta tras confirmación y motivo; cancelar no guarda', async () => {
  const previousFetch = globalThis.fetch;
  const calls = [];
  const conflict = () => new Response(JSON.stringify({ code: 'CONFIRMAR_IDENTIDAD', campos: ['nombres'] }), { status: 409 });
  globalThis.fetch = async (_url, options) => {
    calls.push(JSON.parse(options.body));
    return calls.length === 1 ? conflict() : new Response('{}', { status: 200 });
  };
  window.confirm = (message) => { assert.ok(message.includes('nombres')); return true; };
  window.prompt = () => 'Corrección ficticia';
  try {
    assert.equal((await updatePatientWithConfirmation(endpoint, { nombres: 'Demo nuevo' })).status, 200);
    assert.equal(calls[1].confirmar_identidad, true);
    assert.equal(calls[1].motivo_rectificacion, 'Corrección ficticia');
    calls.length = 0;
    window.confirm = () => false;
    assert.equal((await updatePatientWithConfirmation(endpoint, { nombres: 'Otro' })).status, 409);
    assert.equal(calls.length, 1);
    calls.length = 0;
    window.confirm = () => true;
    window.prompt = () => '';
    assert.equal((await updatePatientWithConfirmation(endpoint, { nombres: 'Otro' })).status, 409);
    assert.equal(calls.length, 1);
  } finally { globalThis.fetch = previousFetch; }
});
