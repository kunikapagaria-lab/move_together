import type { CorsOptions } from 'cors';

// Origins allowed to make credentialed requests to the API.
// - Any localhost port (local dev)
// - Any *.vercel.app preview/production deployment of this project
// - An explicit CLIENT_URL from env, if set (e.g. a custom domain)
const isAllowedOrigin = (origin: string): boolean => {
  if (origin.includes('localhost') || origin.includes('127.0.0.1')) return true;
  if (/^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin)) return true;

  const clientUrl = process.env.CLIENT_URL;
  if (clientUrl) {
    const normalized = clientUrl.startsWith('http') ? clientUrl : `https://${clientUrl}`;
    if (origin === normalized) return true;
  }

  return false;
};

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // No origin header (server-to-server, curl, mobile apps) - allow.
    if (!origin) return callback(null, true);

    if (isAllowedOrigin(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
};
