import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { I18nValidationPipe, I18nValidationExceptionFilter } from 'nestjs-i18n';
import { AppModule } from '@root/app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('APP_PORT') || 3000;
  const apiPrefix = configService.get<string>('API_PREFIX') || 'api/v1';
  const appName = configService.get<string>('APP_NAME') || 'NestApp';
  const isProduction = configService.get<string>('NODE_ENV') === 'production';

  app.use(
    helmet({
      // Swagger UI needs inline scripts/styles that helmet's default CSP blocks.
      contentSecurityPolicy: isProduction ? undefined : false,
    }),
  );
  app.use(cookieParser());

  app.setGlobalPrefix(apiPrefix);

  const config = new DocumentBuilder()
    .setTitle(appName)
    .setDescription(`${appName} API Documentation`)
    .setVersion('1.0')
    .addBearerAuth()
    .addServer(`http://localhost:${port}/${apiPrefix}`, 'Local')
    .addServer(`https://api.example.com/${apiPrefix}`, 'Staging')
    .addServer(`https://api.myapp.com/${apiPrefix}`, 'Production')
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    ignoreGlobalPrefix: true,
  });

  SwaggerModule.setup('docs', app, document);

  app.enableCors({
    origin: configService.get<string>('CORS_ORIGIN') || '*',
    credentials: true,
  });

  // Replaces ValidationPipe 1:1 — same options, plus per-request translation
  // of class-validator messages via i18nValidationMessage() (research.md
  // Decision 1).
  app.useGlobalPipes(
    new I18nValidationPipe({ transform: true, whitelist: true }),
  );
  // GlobalExceptionFilter and ResponseInterceptor need TRANSLATOR (DI) and
  // are registered as APP_FILTER / APP_INTERCEPTOR in I18nModule instead of
  // instantiated here.
  //
  // I18nValidationPipe's built-in exceptionFactory throws I18nValidationException,
  // not a plain BadRequestException: exception.getResponse() is just the
  // literal status text ("Bad Request"), and the translated per-field errors
  // live on `exception.errors` — a shape GlobalExceptionFilter does not read.
  // Nest checks global filters in *reverse* registration order, and the
  // APP_FILTER-provided GlobalExceptionFilter (registered in I18nModule) is
  // resolved during NestFactory.create(), before this line runs — so
  // registering this filter here (i.e. after) makes it win for
  // I18nValidationException specifically, while GlobalExceptionFilter still
  // handles every other exception unchanged. Confirmed against
  // @nestjs/core's exception-filter resolution (ExceptionsHandler.next ->
  // selectExceptionFilterMetadata over a reversed filter list), not assumed.
  app.useGlobalFilters(
    new I18nValidationExceptionFilter({ detailedErrors: false }),
  );

  await app.listen(port);
  logger.log(
    `🚀 [${appName}] running on http://localhost:${port}/${apiPrefix}`,
  );
  logger.log(`📚 Swagger documentation: http://localhost:${port}/docs`);
}

void bootstrap();
