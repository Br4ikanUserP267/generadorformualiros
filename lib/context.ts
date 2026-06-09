import { AsyncLocalStorage } from 'async_hooks';

export interface RequestContext {
  userEmail: string;
  userName: string;
  ipAddress?: string;
}

export const requestContext = new AsyncLocalStorage<RequestContext>();
