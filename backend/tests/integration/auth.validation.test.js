import test from 'node:test';
import assert from 'node:assert/strict';
import app from '../../src/app.js';
import { withTestServer } from '../helpers/httpTestClient.js';

test('POST /api/v1/auth/login rejects invalid payload', async () => {
  await withTestServer(app, async ({ request }) => {
    const response = await request('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'bad-email', password: '123' })
    });
    assert.equal(response.status, 400);
    assert.equal(response.body.success, false);
    assert.equal(response.body.error.code, 'VALIDATION_ERROR');
  });
});

test('POST /api/v1/auth/register rejects missing role', async () => {
  await withTestServer(app, async ({ request }) => {
    const response = await request('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name: 'User', email: 'user@example.com', password: 'password123' })
    });

    assert.equal(response.status, 400);
    assert.equal(response.body.success, false);
    assert.equal(response.body.error.code, 'VALIDATION_ERROR');
  });
});
