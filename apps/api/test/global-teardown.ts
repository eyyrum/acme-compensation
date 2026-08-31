import { disconnect } from './setup';

export default async function globalTeardown(): Promise<void> {
  await disconnect();
}
