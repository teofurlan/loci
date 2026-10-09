import { useEffect, useState } from 'react';
import { pixelizeStyle, type StyleLike } from '../model/pixel-style';

/** The upstream OpenFreeMap style, recolored at load by `pixelizeStyle`. */
export const BASE_STYLE_URL = 'https://tiles.openfreemap.org/styles/positron';
const TIMEOUT_MS = 8000;

let cached: Promise<StyleLike> | null = null;

function load(): Promise<StyleLike> {
  if (!cached) {
    const request = Promise.race([
      fetch(BASE_STYLE_URL).then((response) => {
        if (!response.ok) throw new Error(`style ${response.status}`);
        return response.json() as Promise<StyleLike>;
      }),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('style timeout')), TIMEOUT_MS)),
    ]).then(pixelizeStyle);
    cached = request;
    // A failure must not stay cached: the next screen tries again.
    request.catch(() => {
      if (cached === request) cached = null;
    });
  }
  return cached;
}

export type PixelStyleState = { style: StyleLike | null; failed: boolean };

/** The pixel-terrain map style. `failed` means the plain upstream style should be used instead. */
export function usePixelStyle(): PixelStyleState {
  const [state, setState] = useState<PixelStyleState>({ style: null, failed: false });
  useEffect(() => {
    let live = true;
    load().then(
      (style) => live && setState({ style, failed: false }),
      () => live && setState({ style: null, failed: true }),
    );
    return () => {
      live = false;
    };
  }, []);
  return state;
}
