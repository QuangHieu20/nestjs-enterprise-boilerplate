import { EntityManager } from 'typeorm';

/**
 * Runs a unit of work inside a single DB transaction.
 * The callback receives the transactional EntityManager; every write done
 * through it commits or rolls back atomically. This is what makes the outbox
 * reliable: the business row and the outbox row are written in one transaction.
 */
export interface ITransactionRunner {
  run<T>(work: (manager: EntityManager) => Promise<T>): Promise<T>;
}
