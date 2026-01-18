import { defineConfig } from 'orval';

export default defineConfig({
  gourmet7: {
    input: {
      target: '../backend/openapi.json',
      filters: {
        tags: ['agents', 'sessions', 'approvals', 'wallets', 'schedules'],
      },
      override: {
        transformer: './src/api/openapi-transformer.ts',
      },
    },
    output: {
      mode: 'tags-split',
      target: './src/api/endpoints',
      schemas: './src/api/schemas',
      client: 'react-query',
      mock: false,
      prettier: true,
      override: {
        mutator: {
          path: './src/api/axios-instance.ts',
          name: 'customInstance',
        },
      },
    },
  },
});
