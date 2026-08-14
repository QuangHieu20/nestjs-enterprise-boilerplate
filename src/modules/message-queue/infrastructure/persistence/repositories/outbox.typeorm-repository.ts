import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import {
  IOutboxRepository,
  OutboxRecord,
} from '@modules/message-queue/application/ports/outbox.repository.interface';
import { OutboxEvent } from '@modules/message-queue/domain/types/outbox-event.type';
import { OutboxStatus } from '@modules/message-queue/domain/enums/outbox-status.enum';
import { OutboxPolicy } from '@modules/message-queue/domain/constants/outbox.constants';
import { OutboxMessageOrmEntity } from '@modules/message-queue/infrastructure/persistence/entities/outbox-message.orm-entity';

@Injectable()
export class OutboxTypeOrmRepository implements IOutboxRepository {
  constructor(
    @InjectRepository(OutboxMessageOrmEntity)
    private readonly repo: Repository<OutboxMessageOrmEntity>,
  ) {}

  async enqueue(manager: EntityManager, event: OutboxEvent): Promise<void> {
    const row = manager.create(OutboxMessageOrmEntity, {
      pattern: event.pattern,
      payload: event.payload,
      status: OutboxStatus.PENDING,
      attempts: 0,
    });
    await manager.save(row);
  }

  async claimBatch(limit: number): Promise<OutboxRecord[]> {
    // One short transaction: lock a batch of PENDING rows (skipping rows another
    // relay already holds), flip them to PROCESSING and bump attempts. The
    // actual publish happens outside this transaction — no network under a lock.
    return this.repo.manager.transaction(async (manager) => {
      const repo = manager.getRepository(OutboxMessageOrmEntity);
      const staleBefore = new Date(
        Date.now() - OutboxPolicy.PROCESSING_STALE_MS,
      );

      const rows = await repo
        .createQueryBuilder('o')
        .setLock('pessimistic_write')
        .setOnLocked('skip_locked')
        .where(
          'o.status = :pending OR (o.status = :processing AND o.claimedAt < :staleBefore)',
          {
            pending: OutboxStatus.PENDING,
            processing: OutboxStatus.PROCESSING,
            staleBefore,
          },
        )
        .orderBy('o.createdAt', 'ASC')
        .take(limit)
        .getMany();

      if (rows.length === 0) return [];

      const ids = rows.map((r) => r.id);
      await repo.update(ids, {
        status: OutboxStatus.PROCESSING,
        claimedAt: new Date(),
        attempts: () => 'attempts + 1',
      });

      return rows.map((r) => ({
        id: r.id,
        pattern: r.pattern,
        payload: r.payload,
        attempts: r.attempts + 1,
      }));
    });
  }

  async markPublished(id: string): Promise<void> {
    await this.repo.update(id, {
      status: OutboxStatus.PUBLISHED,
      publishedAt: new Date(),
    });
  }

  async markFailed(
    id: string,
    error: string,
    maxAttempts: number,
  ): Promise<void> {
    const row = await this.repo.findOne({ where: { id } });
    const attempts = row?.attempts ?? maxAttempts;
    const status =
      attempts >= maxAttempts ? OutboxStatus.FAILED : OutboxStatus.PENDING;
    await this.repo.update(id, { status, lastError: error.slice(0, 1000) });
  }
}
