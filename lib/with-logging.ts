import { NextApiRequest, NextApiResponse } from 'next';
import { requestContext } from './context';
import { getAuthUser } from './auth-server';

export function withLogging(handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    let userEmail = 'unknown@csm.net.co';
    let userName = 'Desconocido';
    
    try {
      const user = await getAuthUser(req);
      if (user) {
        userEmail = user.email || 'unknown@csm.net.co';
        userName = user.nombre || 'Desconocido';
      }
    } catch (e) {
      console.warn('Failed to parse user session in withLogging:', e);
    }

    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '';

    return requestContext.run({ userEmail, userName, ipAddress }, () => {
      return handler(req, res);
    });
  };
}
