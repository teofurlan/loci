import { pickVoice, type VoiceInfo } from './voice';

const v = (identifier: string, language: string, quality: 'Default' | 'Enhanced' = 'Default', name = identifier): VoiceInfo => ({
  identifier,
  name,
  language,
  quality,
});

describe('pickVoice', () => {
  it('returns undefined for an empty list', () => {
    expect(pickVoice([], 'en-US')).toBeUndefined();
  });

  it('returns undefined when no voice speaks the language', () => {
    expect(pickVoice([v('fr-fr-x-local', 'fr-FR')], 'en-US')).toBeUndefined();
  });

  it('prefers an exact locale enhanced local voice over the others', () => {
    const voices = [
      v('en-gb-x-local', 'en-GB', 'Enhanced'),
      v('en-us-x-default-local', 'en-US', 'Default'),
      v('en-us-x-best-local', 'en-US', 'Enhanced'),
    ];
    expect(pickVoice(voices, 'en-US')).toBe('en-us-x-best-local');
  });

  it('skips network voices even when they are Enhanced', () => {
    const voices = [v('en-us-x-abc-network', 'en-US', 'Enhanced'), v('en-us-x-abc-local', 'en-US', 'Default')];
    expect(pickVoice(voices, 'en-US')).toBe('en-us-x-abc-local');
  });

  it('returns undefined when only network voices match', () => {
    expect(pickVoice([v('en-us-x-abc-network', 'en-US', 'Enhanced')], 'en-US')).toBeUndefined();
  });

  it('falls back to the base language, es-AR to es-ES', () => {
    const voices = [v('en-us-x-a-local', 'en-US'), v('es-es-x-a-local', 'es-ES')];
    expect(pickVoice(voices, 'es-AR')).toBe('es-es-x-a-local');
  });

  it('accepts underscore locales and a bare language', () => {
    expect(pickVoice([v('en-us-x-a-local', 'en_US')], 'en')).toBe('en-us-x-a-local');
  });

  it('breaks ties deterministically by identifier', () => {
    const a = v('en-us-x-aaa-local', 'en-US');
    const b = v('en-us-x-bbb-local', 'en-US');
    expect(pickVoice([b, a], 'en-US')).toBe('en-us-x-aaa-local');
    expect(pickVoice([a, b], 'en-US')).toBe('en-us-x-aaa-local');
  });
});
