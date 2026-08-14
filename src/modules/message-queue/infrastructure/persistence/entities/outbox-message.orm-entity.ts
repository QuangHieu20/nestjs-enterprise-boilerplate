import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { OutboxStatus } from '@modules/message-queue/domain/enums/outbox-status.enum';

/**
 * Transactional-outbox table. A row is written in the same DB transaction as
 * the business change; the relay later publishes it and flips the status.
 */
@Entity('outbox_messages')
@Index(['status', 'createdAt'])
export class OutboxMessageOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Event pattern, e.g. "user.registered". */
  @Column({ type: 'varchar' })
  pattern: string;

  /** Event payload, stored as JSON. */
  @Column({ type: 'jsonb' })
  payload: Record<string, unknown>;

  @Column({ type: 'varchar', default: OutboxStatus.PENDING })
  status: OutboxStatus;

  /** Number of delivery attempts made by the relay. */
  @Column({ type: 'int', default: 0 })
  attempts: number;

  /** Last publish error (when status is FAILED / being retried). */
  @Column({ type: 'text', nullable: true })
  lastError?: string;

  /** When the row was last claimed by a relay (for stale-reclaim). */
  @Column({ type: 'timestamptz', nullable: true })
  claimedAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  publishedAt?: Date;
}
