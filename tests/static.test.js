const test = require('node:test');
const assert = require('node:assert');
const request = require('supertest');

process.env.NODE_ENV = 'test';
const app = require('../server/server');

test('GET / should serve the static frontend landing page', async () => {
  const res = await request(app).get('/');
  assert.strictEqual(res.statusCode, 200);
  assert.ok(res.text.includes('Business Incubator') || res.text.includes('html'));
});
