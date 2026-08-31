'use server';

import { revalidatePath } from 'next/cache';
import { updateSalarySchema } from '@acme/shared';
import { api, ApiError } from '@/lib/api';

export interface SalaryActionState {
  status: 'idle' | 'success' | 'error';
  message?: string;
}

/**
 * Server Action rather than a client-side fetch: the mutation runs on the
 * server, so revalidatePath can invalidate the directory and dashboard in
 * the same round trip. No manual cache juggling on the client.
 */
export async function updateSalaryAction(
  employeeId: number,
  baseSalaryMinor: number,
): Promise<SalaryActionState> {
  const parsed = updateSalarySchema.safeParse({ baseSalaryMinor });

  if (!parsed.success) {
    return { status: 'error', message: parsed.error.issues[0].message };
  }

  try {
    await api.employees.updateSalary(employeeId, parsed.data.baseSalaryMinor);
  } catch (error) {
    if (error instanceof ApiError) {
      return { status: 'error', message: error.message };
    }
    return { status: 'error', message: 'Could not reach the compensation service.' };
  }

  // Salary appears on the detail page, in the directory, and in every
  // dashboard aggregate — all three are now stale.
  revalidatePath(`/employees/${employeeId}`);
  revalidatePath('/employees');
  revalidatePath('/');

  return { status: 'success', message: 'Salary updated.' };
}
