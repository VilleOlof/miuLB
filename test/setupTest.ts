import { fetch } from 'cross-fetch';
global.fetch = fetch;

import { loadEnv } from 'vite';
Object.assign(process.env, loadEnv("development", './', ''))
