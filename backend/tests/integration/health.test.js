import test from 'node:test';
import assert from 'node:assert/strict';
import app from '../../src/app.js';
import { withTestServer } from '../helpers/httpTestClient.js';

test('GET /health returns ok', async () => {
  await withTestServer(app, async ({ request }) => {
    const response = await request('/health');
    assert.equal(response.status, 200);
    assert.equal(response.body.success, true);
    assert.equal(response.body.data.status, 'ok');
  });
});
