/** Transactional-outbox relay tuning (publisher side only). */
export const OutboxPolicy = {
  /** How often the relay polls the outbox table for pending events. */
  POLL_INTERVAL_MS: 5_000,
  /** Max events claimed and published per poll. */
  BATCH_SIZE: 20,
  /**
   * Give up (status = FAILED) after this many delivery attempts. With
   * POLL_INTERVAL_MS=5s, 20 attempts ≈ 100s of broker downtime tolerated before
   * an event needs manual replay (reset FAILED → PENDING). Raise for longer
   * outages; FAILED just means "durable, awaiting replay", never "lost".
   */
  MAX_ATTEMPTS: 20,
  /** Reclaim rows stuck in PROCESSING longer than this (crashed relay). */
  PROCESSING_STALE_MS: 60_000,
} as const;

/** Name of the scheduled relay job (SchedulerRegistry / @Interval). */
export const OUTBOX_RELAY_JOB = 'outbox-relay';
