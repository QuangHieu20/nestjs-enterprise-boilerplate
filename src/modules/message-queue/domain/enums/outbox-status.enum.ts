export enum OutboxStatus {
  /** Written by a business transaction, awaiting delivery. */
  PENDING = 'pending',
  /** Claimed by a relay instance, delivery in progress. */
  PROCESSING = 'processing',
  /** Successfully published to the broker. */
  PUBLISHED = 'published',
  /** Exhausted MAX_ATTEMPTS — needs manual inspection / replay. */
  FAILED = 'failed',
}
