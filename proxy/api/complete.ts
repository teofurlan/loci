import { createHandler } from '../src/handler';

// Created once per function instance so the in-memory rate limiter survives across requests.
const handle = createHandler({
  fetch: (url, init) => fetch(url, init),
  env: process.env,
  now: Date.now,
});

// Web Handler shape from https://vercel.com/docs/functions/functions-api-reference
export default {
  fetch(request: Request): Promise<Response> {
    return handle(request);
  },
};
