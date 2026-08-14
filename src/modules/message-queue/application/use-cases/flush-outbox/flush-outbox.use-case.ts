import { Inject, Injectable, Logger } from '@nestjs/common';
import { IUseCase } from '@shared/application/use-case.interface';
import {
  OUTBOX_REPOSITORY,
  MESSAGE_PUBLISHER,
} from '@modules/message-queue/application/ports/tokens';
import { type IOutboxRepository } from '@modules/message-queue/application/ports/outbox.repository.interface';
import { type IMessagePublisher } from '@modules/message-queue/application/ports/message-publisher.interface';
import { MessagePayloads } from '@modules/message-queue/domain/types/message-payloads.type';
import { OutboxPolicy } from '@modules/message-queue/domain/constants/outbox.constants';

/**
 * Drains the outbox: claim a batch of pending events, publish each to the
 * broker, and mark it published (or failed). Idempotent and safe to run on
 * multiple instances — claimBatch hands each row to exactly one caller.
 */
@Injectable()
export class FlushOutboxUseCase implements IUseCase<void, void> {
  private readonly logger = new Logger(FlushOutboxUseCase.name);

  constructor(
    @Inject(OUTBOX_REPOSITORY) private readonly outbox: IOutboxRepository,
    @Inject(MESSAGE_PUBLISHER) private readonly publisher: IMessagePublisher,
  ) {}

  async execute(): Promise<void> {
    const batch = await this.outbox.claimBatch(OutboxPolicy.BATCH_SIZE);
    if (batch.length === 0) return;

    this.logger.log(`Relaying ${batch.length} outbox event(s)`);

    for (const record of batch) {
      try {
        await this.publisher.emit(
          record.pattern as keyof MessagePayloads,
          record.payload as MessagePayloads[keyof MessagePayloads],
        );
        await this.outbox.markPublished(record.id);
      } catch (error) {
        const message =
          error instanceof Error
            ? `${error.name}: ${error.message}`
            : String(error);
        this.logger.error(
          `Outbox event ${record.id} publish failed (attempt ${record.attempts}/${OutboxPolicy.MAX_ATTEMPTS}): ${message}`,
        );
        await this.outbox.markFailed(
          record.id,
          message,
          OutboxPolicy.MAX_ATTEMPTS,
        );
      }
    }
  }
}
