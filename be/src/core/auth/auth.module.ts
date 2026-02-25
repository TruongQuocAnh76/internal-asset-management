import { Injectable, Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PassportSerializer } from '@nestjs/passport';
import { PrismaService } from '../database/prisma.service';
import { User } from 'src/packages/users/users.types';
import { DoneCallback } from 'passport';
import { DatabaseModule } from '../database/database.module';
import { UsersModule } from 'src/packages/users/users.module';
import { LocalStrategy } from './strategy/session.strategy';
@Injectable()
export class SessionSerializer extends PassportSerializer {
  constructor(private prisma: PrismaService) {
    super();
  }

  serializeUser(user: User, done: DoneCallback) {
    done(null, user.id);
  }
  async deserializeUser(userId: string, done: DoneCallback) {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      include: {
        user_roles: {
          include: {
            role: {
              include: {
                role_permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // flatten permissions
    if (user) {
      const permissions = user.user_roles.flatMap((userRole) =>
        userRole.role.role_permissions.map(
          (rolePermission) => rolePermission.permission.name,
        ),
      );
      (user as any).permissions = Array.from(new Set(permissions));
    }
    done(null, user);
  }
}

@Module({
  imports: [DatabaseModule, UsersModule],
  controllers: [AuthController],
  providers: [AuthService, SessionSerializer, LocalStrategy],
})
export class AuthModule {}
