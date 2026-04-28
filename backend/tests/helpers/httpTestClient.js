import { once } from 'node:events';
import { createServer } from 'node:http';

export async function withTestServer(app, run) {
  const server = createServer(app);
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');

  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    return await run({
      async request(path, options = {}) {
        const response = await fetch(`${baseUrl}${path}`, {
          headers: {
            'content-type': 'application/json',
            ...(options.headers || {})
          },
          ...options
        });

        let body = null;
        const text = await response.text();
        if (text) {
          body = JSON.parse(text);
        }

        return { status: response.status, body };
      }
    });
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }
}
