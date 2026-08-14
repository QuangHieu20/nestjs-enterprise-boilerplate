import { MessagePayloads } from '@modules/message-queue/domain/types/message-payloads.type';

/**
 * An event queued for reliable publishing via the transactional outbox.
 * Same pattern/payload contract as a direct publish — only the delivery
 * guarantee differs (persisted first, published later by the relay).
 */
export interface OutboxEvent<
  TPattern extends keyof MessagePayloads = keyof MessagePayloads,
> {
  pattern: TPattern;
  payload: MessagePayloads[TPattern];
}
