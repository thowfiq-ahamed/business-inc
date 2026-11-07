const test = require('node:test');
const assert = require('node:assert');
const request = require('supertest');

process.env.NODE_ENV = 'test';
const app = require('../server/server');

test('GET /metrics should expose Prometheus metrics', async () => {
  const res = await request(app).get('/metrics');
  assert.strictEqual(res.statusCode, 200);
  assert.ok(res.text.includes('business_inc_http_requests_total') || res.text.includes('business_inc_'));
  assert.ok(res.text.includes('business_inc_mongodb_status'));
});
