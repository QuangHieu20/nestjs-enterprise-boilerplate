import { Injectable, Logger } from '@nestjs/common';
import { RmqContext } from '@nestjs/microservices';
import type { ChannelWrapper } from 'amqp-connection-manager';
import type { ConsumeMessage } from 'amqplib';
import {
  ConsumerRetryPolicy,
  MessageHeaders,
  Queues,
} from '@modules/message-queue/domain/constants/message-queue.constants';
import { NonRetryableException } from '@modules/message-queue/application/exceptions/non-retryable.exception';

export interface RetryTopology {
  /** Main queue — the retry queue dead-letters back here for another attempt. */
  queue: string;
  /** Delay queue that holds a message for `backoffMs` before re-delivery. */
  retryQueue: string;
  /** Dead-letter / parking queue for exhausted or non-retryable messages. */
  dlq: string;
  maxRetries: number;
  backoffMs: number;
}

const DEFAULT_TOPOLOGY: RetryTopology = {
  queue: Queues.NOTIFICATION_EVENTS,
  retryQueue: Queues.NOTIFICATION_EVENTS_RETRY,
  dlq: Queues.NOTIFICATION_EVENTS_DLQ,
  maxRetries: ConsumerRetryPolicy.MAX_RETRIES,
  backoffMs: ConsumerRetryPolicy.BACKOFF_MS,
};

/**
 * Wraps a consumer handler with the production retry pattern used by large
 * systems (retry queue + DLQ):
 *
 *   handler ok            → ack.
 *   transient error       → park the message in a TTL retry queue that
 *                           dead-letters back to the main queue (fixed-delay
 *                           backoff), up to `maxRetries`.
 *   retries exhausted OR  → route to the DLQ (parking lot) with error metadata,
 *   NonRetryableException   for inspection / manual replay.
 *
 * Delivery is at-least-once, so handlers MUST be idempotent.
 */
@Injectable()
export class RmqRetryHandler {
  private readonly logger = new Logger(RmqRetryHandler.name);
  private topologyReady = false;

  async execute<T>(
    context: RmqContext,
    data: T,
    handler: (data: T) => Promise<void> | void,
    topology: RetryTopology = DEFAULT_TOPOLOGY,
  ): Promise<void> {
    const channel = context.getChannelRef() as ChannelWrapper;
    const message = context.getMessage() as ConsumeMessage;

    await this.ensureTopology(channel, topology);

    try {
      await handler(data);
      channel.ack(message);
    } catch (error) {
      const attempt = this.retryCount(message);
      const permanent = error instanceof NonRetryableException;

      if (!permanent && attempt < topology.maxRetries) {
        this.logger.warn(
          `Handler failed (attempt ${attempt + 1}/${topology.maxRetries}) — retrying in ${topology.backoffMs}ms: ${this.describe(error)}`,
        );
        await this.parkForRetry(channel, message, attempt + 1, topology);
      } else {
        const reason = permanent
          ? 'non-retryable'
          : `${topology.maxRetries} retries exhausted`;
        this.logger.error(
          `Routing message to DLQ "${topology.dlq}" (${reason}): ${this.describe(error)}`,
        );
        await this.routeToDlq(channel, message, error, topology);
      }

      // The original message is now safely re-published elsewhere → ack to
      // remove it. (Publish-then-ack keeps at-least-once: a crash in between
      // re-delivers a duplicate, never drops the message.)
      channel.ack(message);
    }
  }

  /** Idempotently declare the retry (TTL→main) and DLQ queues. Runs once. */
  private async ensureTopology(
    channel: ChannelWrapper,
    t: RetryTopology,
  ): Promise<void> {
    if (this.topologyReady) return;
    await channel.assertQueue(t.retryQueue, {
      durable: true,
      messageTtl: t.backoffMs,
      deadLetterExchange: '',
      deadLetterRoutingKey: t.queue,
    });
    await channel.assertQueue(t.dlq, { durable: true });
    this.topologyReady = true;
  }

  private retryCount(message: ConsumeMessage): number {
    const headers = message.properties.headers ?? {};
    return Number(headers[MessageHeaders.RETRY_COUNT] ?? 0);
  }

  private async parkForRetry(
    channel: ChannelWrapper,
    message: ConsumeMessage,
    attempt: number,
    t: RetryTopology,
  ): Promise<void> {
    await channel.sendToQueue(t.retryQueue, message.content, {
      persistent: true,
      headers: {
        ...message.properties.headers,
        [MessageHeaders.RETRY_COUNT]: attempt,
      },
    });
  }

  private async routeToDlq(
    channel: ChannelWrapper,
    message: ConsumeMessage,
    error: unknown,
    t: RetryTopology,
  ): Promise<void> {
    await channel.sendToQueue(t.dlq, message.content, {
      persistent: true,
      headers: {
        ...message.properties.headers,
        [MessageHeaders.ERROR]: this.describe(error),
        [MessageHeaders.FAILED_AT]: new Date().toISOString(),
      },
    });
  }

  private describe(error: unknown): string {
    return error instanceof Error
      ? `${error.name}: ${error.message}`
      : String(error);
  }
}
