import { RmqOptions, Transport } from '@nestjs/microservices';
import { RabbitMqConfig } from '@modules/message-queue/infrastructure/config/rabbitmq.config';

interface BuildRmqOptions {
  /**
   * Manual acknowledgement. Enable ONLY for the consumer server
   * (connectMicroservice) — it lets @EventPattern handlers ack/nack explicitly.
   * Must stay off for the publishing ClientProxy: a client with noAck:false
   * makes its reply-queue consumer fail with "406 PRECONDITION_FAILED - reply
   * consumer cannot acknowledge".
   */
  manualAck?: boolean;
}

/**
 * Single source of truth for RMQ connection options, shared by the publisher
 * (ClientsModule) and the consumer (main.ts `connectMicroservice`) so both ends
 * agree on url/queue/durability. The one thing that differs is `noAck`, hence
 * the `manualAck` flag.
 */
export function buildRmqOptions(
  config: RabbitMqConfig,
  { manualAck = false }: BuildRmqOptions = {},
): RmqOptions {
  return {
    transport: Transport.RMQ,
    options: {
      urls: [config.url],
      queue: config.queue,
      queueOptions: { durable: config.durable },
      prefetchCount: config.prefetchCount,
      noAck: !manualAck,
      // Persist messages to disk (deliveryMode=2) so a durable queue keeps them
      // across a broker restart. durable queue + persistent message + publisher
      // confirm = messages survive a RabbitMQ crash, not just app crashes.
      persistent: true,
    },
  };
}
