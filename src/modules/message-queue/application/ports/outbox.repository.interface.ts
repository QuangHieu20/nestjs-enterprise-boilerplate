import { EntityManager } from 'typeorm';
import { OutboxEvent } from '@modules/message-queue/domain/types/outbox-event.type';

/** A claimed outbox row the relay is about to publish. */
export interface OutboxRecord {
  id: string;
  pattern: string;
  payload: unknown;
  attempts: number;
}

export interface IOutboxRepository {
  /**
   * Insert a PENDING event using the caller's transaction manager so it commits
   * atomically with the business write.
   */
  enqueue(manager: EntityManager, event: OutboxEvent): Promise<void>;

  /**
   * Atomically claim up to `limit` pending events (flip to PROCESSING, bump
   * attempts) skipping rows locked by other callers — safe to run many relays
   * in parallel.
   */
  claimBatch(limit: number): Promise<OutboxRecord[]>;

  /** Mark an event delivered. */
  markPublished(id: string): Promise<void>;

  /**
   * Record a failed attempt: back to PENDING for another try, or FAILED once
   * `maxAttempts` is reached.
   */
  markFailed(id: string, error: string, maxAttempts: number): Promise<void>;
}
