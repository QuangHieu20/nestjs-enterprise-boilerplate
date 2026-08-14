/**
 * Raised when publishing a message fails after all publisher retries.
 *
 * Deliberately not a DomainException: the global filter maps those to HTTP 400,
 * but a broker outage is a server-side fault, not a bad request.
 */
export class MessagePublishException extends Error {
  constructor(
    readonly pattern: string,
    readonly cause: unknown,
  ) {
    super(`Failed to publish message "${pattern}": ${String(cause)}`);
    this.name = 'MessagePublishException';
  }
}
