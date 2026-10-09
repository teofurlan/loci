function tryParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

/** Index of the brace closing the object that opens at `start`, ignoring braces inside strings. */
function findObjectEnd(text: string, start: number): number {
  let depth = 0;
  let inString = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (ch === '\\') i++;
      else if (ch === '"') inString = false;
    } else if (ch === '"') inString = true;
    else if (ch === '{') depth++;
    else if (ch === '}' && --depth === 0) return i;
  }
  return -1;
}

/**
 * Extracts the first valid JSON object from model output, tolerating code fences
 * and surrounding prose. Returns undefined when none is found.
 */
export function extractJson(text: string): unknown {
  const whole = tryParse(text.trim());
  if (whole !== undefined && whole !== null && typeof whole === 'object') return whole;
  for (let start = text.indexOf('{'); start !== -1; start = text.indexOf('{', start + 1)) {
    const end = findObjectEnd(text, start);
    if (end === -1) continue;
    const parsed = tryParse(text.slice(start, end + 1));
    if (parsed !== undefined) return parsed;
  }
  return undefined;
}
