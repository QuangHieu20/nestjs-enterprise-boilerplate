import { MessagePayloads } from '@modules/message-queue/domain/types/message-payloads.type';

/**
 * Port for publishing messages to the broker.
 * Feature code depends on this interface (via the MESSAGE_PUBLISHER token),
 * never on the concrete transport (RabbitMQ / ClientProxy).
 */
export interface IMessagePublisher {
  /**
   * Publish an event. Resolves once the broker has accepted the message
   * (after transient-failure retries). Rejects with MessagePublishException
   * if publishing fails permanently — callers can then react (log / outbox).
   */
  emit<TPattern extends keyof MessagePayloads>(
    pattern: TPattern,
    data: MessagePayloads[TPattern],
  ): Promise<void>;

  /**
   * Request-response: publish and await the consumer's reply (with a timeout).
   */
  send<TResult, TPattern extends keyof MessagePayloads>(
    pattern: TPattern,
    data: MessagePayloads[TPattern],
  ): Promise<TResult>;
}
