import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import session from 'express-session';
import { PrismaSessionStore } from '@quixo3/prisma-session-store';
import { PrismaClient } from '@prisma/client';
import passport from 'passport';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // enable CORS with credentials
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // initialize passport
  const prisma = new PrismaClient();

  app.use(
    session({
      name: 'asset.sid',
      secret: process.env.SESSION_SECRET_KEY,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        sameSite: 'lax',
      },
      store: new PrismaSessionStore(prisma, {
        checkPeriod: 2 * 60 * 1000,
      }),
    }),
  );

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
  await app.listen(process.env.APP_PORT);
}
bootstrap();
