import type { VercelRequest, VercelResponse } from '@vercel/node';
import app from '../server/src/index';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return new Promise<void>((resolve, reject) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    app(req as any, res as any, (err?: unknown) => {
      if (err) return reject(err);
      resolve();
    });
  });
}
