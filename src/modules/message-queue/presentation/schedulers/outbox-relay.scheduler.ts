import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { FlushOutboxUseCase } from '@modules/message-queue/application/use-cases/flush-outbox/flush-outbox.use-case';
import {
  OutboxPolicy,
  OUTBOX_RELAY_JOB,
} from '@modules/message-queue/domain/constants/outbox.constants';

/**
 * Drives the outbox relay on a fixed interval. Any error is swallowed (and
 * logged) so a single bad tick never stops the scheduler.
 */
@Injectable()
export class OutboxRelayScheduler {
  private readonly logger = new Logger(OutboxRelayScheduler.name);

  constructor(private readonly flushOutbox: FlushOutboxUseCase) {}

  @Interval(OUTBOX_RELAY_JOB, OutboxPolicy.POLL_INTERVAL_MS)
  async tick(): Promise<void> {
    try {
      await this.flushOutbox.execute();
    } catch (error) {
      this.logger.error(
        `Outbox relay tick failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}
