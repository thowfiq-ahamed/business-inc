const test = require('node:test');
const assert = require('node:assert');
const request = require('supertest');

process.env.NODE_ENV = 'test';
const app = require('../server/server');

test('GET /api/health should return status 200 and healthy status', async () => {
  const res = await request(app).get('/api/health');
  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(res.body.status, 'healthy');
  assert.strictEqual(res.body.message, 'Server is running');
  assert.ok(typeof res.body.uptime === 'number');
  assert.ok(res.body.timestamp);
});
