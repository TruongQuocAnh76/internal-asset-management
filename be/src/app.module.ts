import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './core/database/database.module';
import { UsersModule } from './packages/users/users.module';
import { AuthModule } from './core/auth/auth.module';
import { AssetsModule } from './packages/assets/assets.module';
@Module({
  imports: [DatabaseModule, UsersModule, AuthModule, AssetsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
