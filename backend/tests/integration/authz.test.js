import test from 'node:test';
import assert from 'node:assert/strict';
import app from '../../src/app.js';
import { withTestServer } from '../helpers/httpTestClient.js';

test('GET /api/v1/courses requires bearer token', async () => {
  await withTestServer(app, async ({ request }) => {
    const response = await request('/api/v1/courses');
    assert.equal(response.status, 401);
    assert.equal(response.body.success, false);
    assert.equal(response.body.error.code, 'UNAUTHORIZED');
  });
});

test('GET /api/v1/analytics/overview requires bearer token', async () => {
  await withTestServer(app, async ({ request }) => {
    const response = await request('/api/v1/analytics/overview');
    assert.equal(response.status, 401);
    assert.equal(response.body.success, false);
    assert.equal(response.body.error.code, 'UNAUTHORIZED');
  });
});
