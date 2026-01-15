import { serveStatic } from '@hono/node-server/serve-static';

export const estatico = serveStatic({
  root: './public'
})
