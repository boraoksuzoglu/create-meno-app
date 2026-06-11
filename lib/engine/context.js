/**
 * Builds the rendering context passed to every template as EJS locals.
 * It is the user's `config` plus a few derived conveniences and the `v()`
 * version helper, so templates can write e.g. `<%= v('express', '^5.1.0') %>`.
 */
import { v } from '../generators/version-resolver.js';

export function buildContext(config) {
  const isTs = config.language === 'ts';
  return {
    ...config,
    isTs,
    lang: isTs ? 'ts' : 'js',
    ext: isTs ? 'ts' : 'js',
    v,
  };
}
