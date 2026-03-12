import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import session from 'express-session';
import { PrismaSessionStore } from '@quixo3/prisma-session-store';
import { PrismaService } from './core/database/prisma.service';
import passport from 'passport';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from '@nestjs/common';
import { LoggingInterceptor } from './core/interceptors/logging.interceptor';
import { AuditInterceptor } from './core/audit/audit.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // enable CORS with credentials
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // initialize passport
  const prisma = app.get(PrismaService);

  app.use(
    session({
      name: 'asset.sid',
      secret: process.env.SESSION_SECRET_KEY,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60, // 1 hour
        rolling: true,
      },
      store: new PrismaSessionStore(prisma, {
        checkPeriod: 2 * 60 * 1000,
      }),
    }),
  );

  app.useLogger(new Logger());
  app.useGlobalInterceptors(new LoggingInterceptor(), new AuditInterceptor());

  const config = new DocumentBuilder()
    .setTitle('Asset Management API')
    .setDescription('The Asset Management API description')
    .setVersion('1.0')
    .addCookieAuth('asset.sid')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  app.use(passport.initialize());
  app.use(passport.session());
  await app.listen(process.env.APP_PORT!);
}
bootstrap();
