import { extractJson } from './json';

describe('extractJson', () => {
  it('parses plain JSON', () => {
    expect(extractJson('{"a":1}')).toEqual({ a: 1 });
  });

  it('parses JSON inside a code fence', () => {
    expect(extractJson('```json\n{"a":1}\n```')).toEqual({ a: 1 });
  });

  it('finds JSON surrounded by prose, including braces inside strings', () => {
    expect(extractJson('Sure! Here you go: {"a":"x } y"} Hope it helps.')).toEqual({ a: 'x } y' });
  });

  it('returns undefined when there is no valid JSON object', () => {
    expect(extractJson('no json here')).toBeUndefined();
    expect(extractJson('{broken')).toBeUndefined();
    expect(extractJson('')).toBeUndefined();
  });
});
