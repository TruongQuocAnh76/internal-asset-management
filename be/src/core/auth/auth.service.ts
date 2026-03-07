import { HttpException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from 'src/packages/users/users.service';
import { SignupDto } from './dto/signup.dto';
import { PrismaService } from '../database/prisma.service';
import { DeploymentStatus } from '@prisma/client';
@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
  ) {}
  async signin(req) {
    const user = await this.validateUser(
      req.body.credential,
      req.body.password,
    );

    if (user.status !== DeploymentStatus.ACTIVE) {
      throw new HttpException(
        {
          status: 403,
          error: 'User account is not active',
        },
        403,
      );
    }

    await new Promise((resolve, reject) => {
      req.login(user, (err) => {
        if (err) {
          throw new HttpException(
            {
              status: 500,
              error: 'Could not log in user',
            },
            500,
          );
        } else {
          resolve(null);
        }
      });
    });

    return { id: user.id, message: 'Signin successful' };
  }

  async validateUser(credential: string, password: string) {
    // verify password
    const user = await this.usersService.findByCredential(credential);
    if (!user) {
      throw new HttpException(
        {
          status: 404,
          error: 'User not found',
        },
        404,
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new HttpException(
        {
          status: 401,
          error: 'Invalid password',
        },
        401,
      );
    }
    return user;
  }

  async signup(dto: SignupDto, req) {
    // check if user already exists
    const existingUser = await this.usersService.findByCredential(dto.email);
    if (existingUser) {
      throw new HttpException(
        {
          status: 409,
          error: 'User already exists',
        },
        409,
      );
    }

    // hash password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // create user
    const newUser = await this.usersService.create({
      ...dto,
      password: hashedPassword,
    });
    return { id: newUser.id, message: 'Signup successful' };
  }

  async signout(req, res) {
    return new Promise((resolve, reject) => {
      req.logout((err) => {
        if (err) {
          return reject(
            new HttpException(
              {
                status: 500,
                error: 'Could not log out user',
              },
              500,
            ),
          );
        }

        req.session?.destroy((sessionError) => {
          if (sessionError) {
            return reject(
              new HttpException(
                {
                  status: 500,
                  error: 'Could not clear session',
                },
                500,
              ),
            );
          }

          res.clearCookie('asset.sid');
          resolve({ message: 'Signout successful' });
        });
      });
    });
  }
}
