/**
 * Throw from a consumer handler when the failure is PERMANENT — bad payload,
 * validation error, business-rule violation — where retrying cannot help.
 * The retry handler routes these straight to the DLQ, skipping wasted retries
 * (a.k.a. "poison message" handling).
 *
 * Deliberately not a DomainException: the global filter maps those to HTTP 400,
 * which is meaningless for a message consumed off the broker.
 */
export class NonRetryableException extends Error {
  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'NonRetryableException';
  }
}
