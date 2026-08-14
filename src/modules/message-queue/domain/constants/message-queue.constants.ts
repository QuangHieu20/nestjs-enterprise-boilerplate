/**
 * Single source of truth for every message-queue NAME shared across services.
 * The auth (publisher) and notification (consumer) services must keep this file
 * identical — it is the cross-service contract (queue names + event names).
 * Nothing name-related should live in .env, where the two services can drift.
 */

/** Queue names. */
export const Queues = {
  /** Main work queue: publisher emits here, consumer listens here. */
  NOTIFICATION_EVENTS: 'notification_events',
  /** Delay queue: parks a failed message for BACKOFF_MS, then dead-letters it
   *  back to the main queue for another attempt (fixed-delay backoff). */
  NOTIFICATION_EVENTS_RETRY: 'notification_events.retry',
  /** Dead-letter queue (parking lot): messages that exhausted retries or are
   *  non-retryable land here for inspection / manual replay. */
  NOTIFICATION_EVENTS_DLQ: 'notification_events.dlq',
} as const;

export type Queue = (typeof Queues)[keyof typeof Queues];

/** Event patterns exchanged over the queue. Renaming breaks in-flight messages. */
export const MessagePatterns = {
  USER_REGISTERED: 'user.registered',
  USER_PASSWORD_RESET_REQUESTED: 'user.password_reset_requested',
} as const;

export type MessagePattern =
  (typeof MessagePatterns)[keyof typeof MessagePatterns];

/** Custom AMQP headers driving the retry / DLQ machinery. */
export const MessageHeaders = {
  RETRY_COUNT: 'x-retry-count',
  ERROR: 'x-error',
  FAILED_AT: 'x-failed-at',
} as const;

/** Consumer-side retry policy: fixed-delay retry queue, then DLQ after N tries. */
export const ConsumerRetryPolicy = {
  MAX_RETRIES: 3,
  BACKOFF_MS: 5_000,
} as const;

/** Publisher-side retry policy for transient publish failures. */
export const PublisherRetryPolicy = {
  MAX_RETRIES: 3,
  BACKOFF_MS: 500,
  SEND_TIMEOUT_MS: 10_000,
} as const;
