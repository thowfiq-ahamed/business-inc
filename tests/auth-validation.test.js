const test = require('node:test');
const assert = require('node:assert');
const request = require('supertest');

process.env.NODE_ENV = 'test';
const app = require('../server/server');

test('POST /api/auth/register should fail with validation error when required fields are missing', async () => {
  const res = await request(app)
    .post('/api/auth/register')
    .send({});
  assert.strictEqual(res.statusCode, 400);
  assert.ok(res.body.message || res.body.error);
});

test('POST /api/auth/login should fail with validation error when email and password are empty', async () => {
  const res = await request(app)
    .post('/api/auth/login')
    .send({});
  assert.strictEqual(res.statusCode, 400);
  assert.ok(res.body.message || res.body.error);
});
