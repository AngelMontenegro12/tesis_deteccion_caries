import test from 'node:test';
import assert from 'node:assert/strict';
import { isValidDni, onlyDniDigits, isValidPhone, phoneError, isValidEmail, isValidDate, todayLocal, calculateAge } from './validation.js';

test('DNI accepts exactly eight digits, including leading zeros, and cleans pasted text', () => {
  assert.equal(onlyDniDigits('00a12 345678'), '00123456');
  assert.equal(isValidDni('00123456'), true);
  assert.equal(isValidDni('1234567a'), false);
  assert.equal(isValidDni('123456789'), false);
});

test('Peruvian mobile phones require nine numeric digits starting with 9', () => {
  assert.equal(isValidPhone('912345678'), true);
  for (const value of ['812345678', '91234567', '9123456789', '91234abcd']) {
    assert.equal(isValidPhone(value), false);
  }
  assert.match(phoneError('812345678'), /empezar en 9/);
  assert.match(phoneError(''), /requerido.*empezar en 9/);
  assert.equal(phoneError('', 'El teléfono del apoderado', false), '');
});

test('Email requires content on both sides of @ and a suffix after a dot', () => {
  assert.equal(isValidEmail('persona@dominio.pe'), true);
  for (const value of ['persona@dominio', 'persona@dominio.', '@dominio.pe', 'persona@.']) {
    assert.equal(isValidEmail(value), false);
  }
});

test('Date bounds reject invalid calendar dates, pre-1900 dates and future dates', () => {
  assert.equal(isValidDate('1900-01-01'), true);
  assert.equal(isValidDate(todayLocal()), true);
  for (const value of ['1899-12-31', '2001-02-29', '2025-13-01', '9999-12-31', '1900-1-01']) {
    assert.equal(isValidDate(value), false);
  }
  assert.equal(calculateAge(todayLocal()), 0);
  assert.equal(calculateAge('1899-12-31'), null);
});
