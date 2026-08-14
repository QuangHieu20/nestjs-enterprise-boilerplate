import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import type { StringValue } from 'ms';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from '@modules/user/user.module';
import { LoginUseCase } from '@modules/auth/application/use-cases/login/login.use-case';
import { RegisterUseCase } from '@modules/auth/application/use-cases/register/register.use-case';
import { RefreshUseCase } from '@modules/auth/application/use-cases/refresh/refresh.use-case';
import { LogoutUseCase } from '@modules/auth/application/use-cases/logout/logout.use-case';
import { MeUseCase } from '@modules/auth/application/use-cases/me/me.use-case';
import { AuthController } from '@modules/auth/presentation/controllers/auth.controller';
import {
  IDENTITY_MANAGER,
  REFRESH_TOKEN_REPOSITORY,
  SOCIAL_IDENTITY_VERIFIER,
} from '@modules/auth/application/ports/tokens';
import { JwtIdentityManager } from '@modules/auth/infrastructure/adapters/jwt-identity.manager';
import { RefreshTokenOrmEntity } from '@modules/auth/infrastructure/persistence/entities/refresh-token.orm-entity';
import { RefreshTokenTypeOrmRepository } from '@modules/auth/infrastructure/persistence/repositories/refresh-token.typeorm-repository';
import { AuthorizationModule } from '@modules/authorization/authorization.module';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from '@modules/auth/presentation/guards/auth.guard';
import { GoogleAuthGuard } from '@modules/auth/presentation/guards/google-auth.guard';
import { GoogleIdentityVerifier } from '@modules/auth/infrastructure/adapters/google-identity.verifier';
import { GoogleRegisterUseCase } from '@modules/auth/application/use-cases/google-register/google-register.use-case';
import { GoogleLoginUseCase } from '@modules/auth/application/use-cases/google-login/google-login.use-case';

@Module({
  imports: [
    UserModule,
    AuthorizationModule,
    TypeOrmModule.forFeature([RefreshTokenOrmEntity]),
    // Register JwtModule asynchronously to read JWT_SECRET from ConfigService
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        // Fallback only: JwtIdentityManager passes an explicit expiresIn per token
        // so that access and refresh lifetimes cannot collapse into one value.
        signOptions: {
          expiresIn: (configService.get<string>('JWT_ACCESS_EXPIRES_IN') ||
            '15m') as StringValue,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    { provide: IDENTITY_MANAGER, useClass: JwtIdentityManager },
    {
      provide: REFRESH_TOKEN_REPOSITORY,
      useClass: RefreshTokenTypeOrmRepository,
    },
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: SOCIAL_IDENTITY_VERIFIER, useClass: GoogleIdentityVerifier },
    GoogleAuthGuard,
    LoginUseCase,
    RegisterUseCase,
    GoogleRegisterUseCase,
    GoogleLoginUseCase,
    RefreshUseCase,
    LogoutUseCase,
    MeUseCase,
  ],
  exports: [
    IDENTITY_MANAGER,
    RegisterUseCase,
    RefreshUseCase,
    LogoutUseCase,
    JwtModule,
  ],
})
export class AuthModule {}
