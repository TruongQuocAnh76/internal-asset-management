import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './core/database/database.module';
import { UsersModule } from './packages/users/users.module';
import { AuthModule } from './core/auth/auth.module';
import { AssetsModule } from './packages/assets/assets.module';
import { RequestsModule } from './packages/requests/requests.module';
import { CategoryModule } from './packages/category/category.module';
import { StorageModule } from './core/storage/storage.module';
@Module({
  imports: [
    DatabaseModule,
    UsersModule,
    AuthModule,
    AssetsModule,
    RequestsModule,
    CategoryModule,
    StorageModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
