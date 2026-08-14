import { registerAs } from '@nestjs/config';
import { Queues } from '@modules/message-queue/domain/constants/message-queue.constants';

export interface RabbitMqConfig {
  url: string;
  queue: string;
  durable: boolean;
  prefetchCount: number;
}

export default registerAs('rabbitmq', (): RabbitMqConfig => ({
  url: process.env.RABBITMQ_URL ?? 'amqp://guest:guest@localhost:5672',
  // Queue name comes from the shared constant (NOT env) so publisher and
  // consumer can never drift apart. Only env-specific values stay in .env.
  queue: Queues.NOTIFICATION_EVENTS,
  durable: process.env.RABBITMQ_QUEUE_DURABLE !== 'false',
  prefetchCount: parseInt(process.env.RABBITMQ_PREFETCH ?? '1', 10),
}));
