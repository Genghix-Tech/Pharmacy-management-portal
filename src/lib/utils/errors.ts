import { AccessDeniedError } from "@/lib/utils/permissions";

export type ActionResult<T = undefined> = { success: true; data: T } | { success: false; error: string };

export function actionSuccess<T>(data: T): ActionResult<T> {
  return { success: true, data };
}

export function actionError(message: string): ActionResult<never> {
  return { success: false, error: message };
}

const KNOWN_DB_PATTERNS: [RegExp, string][] = [
  [/sku/i, "That SKU is already used by another medicine."],
  [/barcode/i, "That barcode is already used by another medicine."],
  [/duplicate key value/i, "That value is already in use — please choose a different one."],
  [/violates foreign key/i, "This record is linked to other data and can't be removed or changed that way."],
  [/violates row-level security/i, "You don't have permission to do that."],
  [/permission denied/i, "You don't have permission to do that."],
  [/JWT|not authenticated|session/i, "Your session has expired. Please sign in again."],
];

const RAW_INTERNAL_ERROR = /relation ".*" does not exist|column ".*" does not exist|syntax error|null value in column|permission denied for table|invalid input syntax/i;

/**
 * Turns any thrown error into copy that's safe to show a pharmacy owner:
 * never leak table/column names, SQL, or stack traces. Our own `RAISE
 * EXCEPTION '...'` messages inside the Postgres RPCs (supabase/migrations)
 * are already written in plain English, so they pass through unchanged;
 * anything that looks like a raw database/internal error gets mapped or
 * replaced with a generic message instead.
 */
export function friendlyError(error: unknown, fallback = "Something went wrong. Please try again."): string {
  if (error instanceof AccessDeniedError) return error.message;

  const raw = error instanceof Error ? error.message : String(error);

  for (const [pattern, message] of KNOWN_DB_PATTERNS) {
    if (pattern.test(raw)) return message;
  }

  if (RAW_INTERNAL_ERROR.test(raw)) return fallback;

  // Otherwise trust it's one of our own human-readable RAISE EXCEPTION
  // messages (e.g. "Only 3 units of Amoxicillin are in stock").
  return raw || fallback;
}
