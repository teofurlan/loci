import Storage from 'expo-sqlite/kv-store';
import { createServices } from '../../application/services';
import { KvVisitedHistory } from '../../adapters/storage/kv-visited-history';

// EXPO_PUBLIC_* variables are inlined only when read statically, so list each one.
const env = {
  EXPO_PUBLIC_LLM_PROXY_URL: process.env.EXPO_PUBLIC_LLM_PROXY_URL,
  EXPO_PUBLIC_OLLAMA_URL: process.env.EXPO_PUBLIC_OLLAMA_URL,
  EXPO_PUBLIC_OLLAMA_MODEL: process.env.EXPO_PUBLIC_OLLAMA_MODEL,
};

/** App-wide composition: real adapters, visited history persisted in expo-sqlite's key-value store. */
export const services = createServices(env, (url, init) => fetch(url, init), {
  history: new KvVisitedHistory(Storage),
});
