/**
 * Config matrix used for golden snapshots and the full verification matrix.
 * Each entry is a complete `config` object as produced by lib/create-app.js.
 */

const base = {
  includeRbac: false,
  rateLimitStore: 'memory',
  includeLogger: false,
  includeUpload: false,
  uploadProvider: 'local',
  includeEmail: false,
  emailMultiLang: false,
  includeJest: false,
  includeEslint: false,
  includeSwagger: false,
  includeDocker: false,
  includeGithubActions: false,
  aiTools: [],
};

export const scenarios = {
  'minimal-js': {
    ...base,
    projectName: 'minimal-js',
    language: 'js',
    includeAuth: false,
    includeRateLimit: false,
  },

  'full-js': {
    ...base,
    projectName: 'full-js',
    language: 'js',
    includeAuth: true,
    includeRbac: true,
    includeRateLimit: true,
    rateLimitStore: 'mongo',
    includeLogger: true,
    includeUpload: true,
    uploadProvider: 'local',
    includeEmail: true,
    emailMultiLang: true,
    includeJest: true,
    includeEslint: true,
    includeSwagger: true,
    includeDocker: true,
    includeGithubActions: true,
    aiTools: ['kiro', 'cursor', 'claude'],
  },

  'full-ts': {
    ...base,
    projectName: 'full-ts',
    language: 'ts',
    includeAuth: true,
    includeRbac: true,
    includeRateLimit: true,
    rateLimitStore: 'mongo',
    includeLogger: true,
    includeUpload: true,
    uploadProvider: 'local',
    includeEmail: true,
    emailMultiLang: true,
    includeJest: true,
    includeEslint: true,
    includeSwagger: true,
    includeDocker: true,
    includeGithubActions: true,
    aiTools: ['kiro', 'cursor', 'claude'],
  },

  'upload-gcs': {
    ...base,
    projectName: 'upload-gcs',
    language: 'js',
    includeAuth: true,
    includeRateLimit: true,
    rateLimitStore: 'memory',
    includeUpload: true,
    uploadProvider: 'gcs',
    includeJest: true,
    includeEslint: true,
    includeSwagger: true,
  },

  'ratelimit-redis': {
    ...base,
    projectName: 'ratelimit-redis',
    language: 'ts',
    includeAuth: true,
    includeRateLimit: true,
    rateLimitStore: 'redis',
    includeJest: true,
    includeEslint: true,
    includeSwagger: true,
  },
};
