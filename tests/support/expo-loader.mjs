// Lets node:test import app modules that use expo-sqlite: maps it to a
// node:sqlite adapter, resolves extensionless imports and loads src/*.js as ESM.
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const STUB = new URL('./expo-sqlite.mjs', import.meta.url).href;

export async function resolve(specifier, context, next) {
  if (specifier === 'expo-sqlite') return { url: STUB, shortCircuit: true };
  if (specifier.startsWith('.') && !/\.[cm]?js$/.test(specifier) && context.parentURL) {
    const url = new URL(`${specifier}.js`, context.parentURL);
    if (existsSync(fileURLToPath(url))) return { url: url.href, shortCircuit: true };
  }
  return next(specifier, context);
}

export async function load(url, context, next) {
  if (url.includes('/src/') && url.endsWith('.js')) {
    return { ...(await next(url, { ...context, format: 'module' })), format: 'module', shortCircuit: true };
  }
  return next(url, context);
}
