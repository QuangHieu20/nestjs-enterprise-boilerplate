import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, retry, timeout, timer } from 'rxjs';
import { IMessagePublisher } from '@modules/message-queue/application/ports/message-publisher.interface';
import { RABBITMQ_CLIENT } from '@modules/message-queue/application/ports/tokens';
import { MessagePayloads } from '@modules/message-queue/domain/types/message-payloads.type';
import { PublisherRetryPolicy } from '@modules/message-queue/domain/constants/message-queue.constants';
import { MessagePublishException } from '@modules/message-queue/application/exceptions/message-publish.exception';

/**
 * RabbitMQ implementation of IMessagePublisher.
 * Delegates to the singleton ClientProxy and adds production-grade resilience:
 * - emit(): retries transient failures with exponential backoff, then throws.
 * - send(): bounded by a timeout so a dead consumer can't hang the caller.
 *
 * (amqp-connection-manager already buffers publishes across reconnects; this
 * layer surfaces and retries the errors it doesn't handle.)
 */
@Injectable()
export class RabbitMqPublisherAdapter implements IMessagePublisher {
  private readonly logger = new Logger(RabbitMqPublisherAdapter.name);

  constructor(@Inject(RABBITMQ_CLIENT) private readonly client: ClientProxy) {}

  async emit<TPattern extends keyof MessagePayloads>(
    pattern: TPattern,
    data: MessagePayloads[TPattern],
  ): Promise<void> {
    try {
      await firstValueFrom(
        this.client.emit(pattern as string, data).pipe(
          retry({
            count: PublisherRetryPolicy.MAX_RETRIES,
            delay: (error, attempt) => {
              this.logger.warn(
                `Publish "${String(pattern)}" failed (attempt ${attempt}/${PublisherRetryPolicy.MAX_RETRIES}), retrying: ${this.describe(error)}`,
              );
              return timer(
                PublisherRetryPolicy.BACKOFF_MS * 2 ** (attempt - 1),
              );
            },
          }),
        ),
      );
    } catch (error) {
      this.logger.error(
        `Publish "${String(pattern)}" failed permanently: ${this.describe(error)}`,
      );
      throw new MessagePublishException(String(pattern), error);
    }
  }

  async send<TResult, TPattern extends keyof MessagePayloads>(
    pattern: TPattern,
    data: MessagePayloads[TPattern],
  ): Promise<TResult> {
    try {
      return await firstValueFrom(
        this.client
          .send<TResult>(pattern as string, data)
          .pipe(timeout(PublisherRetryPolicy.SEND_TIMEOUT_MS)),
      );
    } catch (error) {
      this.logger.error(
        `Request "${String(pattern)}" failed: ${this.describe(error)}`,
      );
      throw new MessagePublishException(String(pattern), error);
    }
  }

  private describe(error: unknown): string {
    return error instanceof Error
      ? `${error.name}: ${error.message}`
      : String(error);
  }
}
