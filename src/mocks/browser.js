import { setupWorker } from 'msw';
import { handlers } from './handlers';

export const worker = setupWorker(...handlers);

export const startMSW = async () => {
  if (process.env.NODE_ENV === 'development') {
    return worker.start({
      onUnhandledRequest: 'bypass',
    });
  }
  return Promise.resolve();
};