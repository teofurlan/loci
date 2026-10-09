/** @jest-environment node */
import complete from './complete';

describe('api/complete entry', () => {
  it('exports a Web-standard fetch handler that rejects non-POST methods', async () => {
    const res = await complete.fetch(new Request('https://proxy.test/api/complete'));
    expect(res.status).toBe(405);
  });
});
