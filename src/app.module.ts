import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import databaseConfig from '@shared/infrastructure/config/database.config';
import throttlerConfig, {
  ThrottlerConfig,
} from '@shared/infrastructure/config/throttler.config';
import rabbitmqConfig from '@modules/message-queue/infrastructure/config/rabbitmq.config';
import i18nConfig from '@modules/i18n/infrastructure/config/i18n.config';
import { AuthModule } from '@modules/auth/auth.module';
import { envVarsSchema } from '@shared/infrastructure/config/env.validation';
import { DatabaseModule } from '@shared/infrastructure/database/database.module';
import { UserModule } from '@modules/user/user.module';
import { AccessControlModule } from '@modules/access-control/access-control.module';
import { MessageQueueModule } from '@modules/message-queue/message-queue.module';
import { I18nModule } from '@modules/i18n/i18n.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      expandVariables: true,
      load: [databaseConfig, throttlerConfig, rabbitmqConfig, i18nConfig],
      validationSchema: envVarsSchema,
      validationOptions: {
        allowUnknown: true,
        abortEarly: true,
      },
    }),
    // Broad default; sensitive routes tighten it with @Throttle().
    // Values come from the 'throttler' namespace (RATE_LIMIT_TTL / RATE_LIMIT_MAX).
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        config.getOrThrow<ThrottlerConfig>('throttler'),
      ],
    }),
    I18nModule,
    DatabaseModule,
    MessageQueueModule,
    UserModule,
    AuthModule,
    AccessControlModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
