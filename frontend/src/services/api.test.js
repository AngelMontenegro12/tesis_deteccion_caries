import assert from 'node:assert/strict';
import test from 'node:test';
import { authenticatedFetch } from './api.js';

const values = new Map();
globalThis.localStorage = {
  getItem: (key) => values.get(key) ?? null,
  setItem: (key, value) => values.set(key, value),
  removeItem: (key) => values.delete(key),
};
globalThis.window = new EventTarget();

test('fetch clínico envía el Bearer de la sesión ficticia sin tocar la red', async () => {
  values.set('user', JSON.stringify({ token: 'fixture-token' }));
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async (_url, options) => {
    assert.equal(options.headers.get('Authorization'), 'Bearer fixture-token');
    return new Response('{}', { status: 200 });
  };
  try {
    assert.equal((await authenticatedFetch('http://localhost:5000/api/pacientes')).status, 200);
  } finally { globalThis.fetch = previousFetch; }
});

test('401 borra sesión y 403 informa sin borrarla', async () => {
  values.set('user', JSON.stringify({ token: 'fixture-token' }));
  const previousFetch = globalThis.fetch;
  let expired = 0;
  let forbidden = 0;
  window.addEventListener('auth:expired', () => expired++);
  window.addEventListener('auth:forbidden', () => forbidden++);
  globalThis.fetch = async () => new Response('{}', { status: 403 });
  try {
    await authenticatedFetch('http://localhost:5000/api/pacientes');
    assert.equal(forbidden, 1);
    assert.ok(values.has('user'));
    globalThis.fetch = async () => new Response('{}', { status: 401 });
    await authenticatedFetch('http://localhost:5000/api/pacientes');
    assert.equal(expired, 1);
    assert.equal(values.has('user'), false);
  } finally { globalThis.fetch = previousFetch; }
});
