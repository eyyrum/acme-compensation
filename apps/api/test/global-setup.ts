import { ensureSeeded } from './setup';

export default async function globalSetup(): Promise<void> {
  await ensureSeeded();
}
