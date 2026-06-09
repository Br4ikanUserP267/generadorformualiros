import { PrismaClient } from '@prisma/client'
import { requestContext } from './context'

declare global {
  // eslint-disable-next-line no-var
  var __prisma__: any | undefined
}

const prismaClientSingleton = () => {
  const client = new PrismaClient()

  return client.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          if (model === 'ActivityLog' || model === 'LoginLog' || model === 'Notification') {
            return query(args);
          }

          const writeOperations = ['create', 'update', 'delete', 'createMany', 'updateMany', 'deleteMany', 'upsert'];
          if (writeOperations.includes(operation)) {
            let beforeRecord: any = null;
            try {
              if (['update', 'delete', 'upsert'].includes(operation) && args?.where) {
                beforeRecord = await (client as any)[model].findUnique({ where: args.where });
              } else if (['updateMany', 'deleteMany'].includes(operation) && args?.where) {
                beforeRecord = await (client as any)[model].findMany({ where: args.where });
              }
            } catch (e) {
              console.warn(`Could not fetch before-state for model ${model}:`, e);
            }

            const result = await query(args);

            try {
              // Get context from AsyncLocalStorage
              const store = requestContext.getStore();
              let email = 'unknown@csm.net.co';
              let name = 'Desconocido';
              let ipAddress = null;

              if (store) {
                email = store.userEmail;
                name = store.userName;
                ipAddress = store.ipAddress || null;
              } else {
                // Try cookie fallback for Next.js App Router (if run inside Server Component/Action)
                try {
                  const { cookies } = require('next/headers');
                  const cookieStore = cookies();
                  const token = cookieStore.get('auth_token')?.value;
                  if (token) {
                    const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
                    email = decoded.email || 'unknown@csm.net.co';
                    name = decoded.nombre || decoded.email || 'Desconocido';
                  }
                } catch (_) {}
              }

              let recordId: string | undefined = undefined;
              if (result && typeof result === 'object') {
                recordId = (result as any).id || undefined;
              } else if (args && args.where && args.where.id) {
                recordId = String(args.where.id);
              }

              await (client as any).activityLog.create({
                data: {
                  userEmail: email,
                  userName: name,
                  action: operation.toUpperCase(),
                  model: model,
                  recordId: recordId ? String(recordId) : null,
                  changes: JSON.stringify(args.data || args.update || args || {}),
                  before: beforeRecord ? JSON.stringify(beforeRecord) : null,
                  ipAddress: ipAddress,
                }
              });
            } catch (err) {
              console.error('Error logging prisma activity for matriz-riesgo:', err);
            }

            return result;
          }

          return query(args);
        }
      }
    }
  });
};

const prisma = global.__prisma__ ?? prismaClientSingleton()
if (process.env.NODE_ENV !== 'production') global.__prisma__ = prisma

export default prisma
