import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientsModule } from '@nestjs/microservices';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  MESSAGE_PUBLISHER,
  OUTBOX_REPOSITORY,
  RABBITMQ_CLIENT,
  TRANSACTION_RUNNER,
} from '@modules/message-queue/application/ports/tokens';
import { RabbitMqConfig } from '@modules/message-queue/infrastructure/config/rabbitmq.config';
import { buildRmqOptions } from '@modules/message-queue/infrastructure/config/rmq-options.factory';
import { RabbitMqPublisherAdapter } from '@modules/message-queue/infrastructure/adapters/rabbitmq-publisher.adapter';
import { RmqRetryHandler } from '@modules/message-queue/infrastructure/adapters/rmq-retry.handler';
import { OutboxMessageOrmEntity } from '@modules/message-queue/infrastructure/persistence/entities/outbox-message.orm-entity';
import { OutboxTypeOrmRepository } from '@modules/message-queue/infrastructure/persistence/repositories/outbox.typeorm-repository';
import { TypeOrmTransactionRunner } from '@modules/message-queue/infrastructure/adapters/typeorm-transaction.runner';
import { FlushOutboxUseCase } from '@modules/message-queue/application/use-cases/flush-outbox/flush-outbox.use-case';
import { OutboxRelayScheduler } from '@modules/message-queue/presentation/schedulers/outbox-relay.scheduler';

/**
 * Global message-queue infrastructure.
 *
 * - Registers ONE singleton RabbitMQ ClientProxy (RABBITMQ_CLIENT), the shared
 *   connection reused by the whole app.
 * - Exposes publishing behind the MESSAGE_PUBLISHER DI token so feature code
 *   never depends on the concrete transport.
 * - Provides the transactional outbox (OUTBOX_REPOSITORY + TRANSACTION_RUNNER) and a
 *   scheduled relay so events are persisted with the business write and
 *   published reliably even if the broker is momentarily down.
 *
 * Consuming (@EventPattern handlers) is enabled per-app in main.ts via
 * `app.connectMicroservice(buildRmqOptions(...))` — see rmq-options.factory.
 */
@Global()
@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([OutboxMessageOrmEntity]),
    ClientsModule.registerAsync([
      {
        name: RABBITMQ_CLIENT,
        inject: [ConfigService],
        useFactory: (configService: ConfigService) =>
          buildRmqOptions(configService.getOrThrow<RabbitMqConfig>('rabbitmq')),
      },
    ]),
  ],
  providers: [
    { provide: MESSAGE_PUBLISHER, useClass: RabbitMqPublisherAdapter },
    { provide: OUTBOX_REPOSITORY, useClass: OutboxTypeOrmRepository },
    { provide: TRANSACTION_RUNNER, useClass: TypeOrmTransactionRunner },
    RmqRetryHandler,
    FlushOutboxUseCase,
    OutboxRelayScheduler,
  ],
  exports: [
    MESSAGE_PUBLISHER,
    OUTBOX_REPOSITORY,
    TRANSACTION_RUNNER,
    RmqRetryHandler,
    ClientsModule,
  ],
})
export class MessageQueueModule {}
