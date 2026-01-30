// mock bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));
import * as bcrypt from 'bcrypt';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { HttpException } from '@nestjs/common';
import { UsersService } from 'src/packages/users/users.service';
import { PrismaClient } from '@prisma/client';

describe('AuthService', () => {
  let service: AuthService;

  const mockUsersService = {
    findByCredential: jest.fn(),
    create: jest.fn(),
  };

  const mockPrismaClient = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: PrismaClient, useValue: mockPrismaClient },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should throws if user not found', async () => {
    mockUsersService.findByCredential.mockResolvedValue(null);

    await expect(
      service.validateUser('nonexistent', 'password'),
    ).rejects.toThrow(HttpException);
  });

  it('should throws if password is invalid', async () => {
    mockUsersService.findByCredential.mockResolvedValue({
      id: '1',
      password: '$2b$10$invalidhashedpasswordstring',
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);
    await expect(
      service.validateUser('existinguser', 'wrongpassword'),
    ).rejects.toThrow(HttpException);
  });

  it('should return user if credentials are valid', async () => {
    const mockUser = {
      id: '1',
      password: '$2b$10$CwTycUXWue0Thq9StjUM0uJ8i1sC3yRyvE4s46HoPazTA/gkGEXdK',
    };
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    mockUsersService.findByCredential.mockResolvedValue(mockUser);

    const result = await service.validateUser('existinguser', 'password');
    expect(result).toBe(mockUser);
  });

  it('should signup a new user', async () => {
    const dto = {
      username: 'newuser',
      email: 'newuser@example.com',
      first_name: 'New',
      last_name: 'User',
      password: 'password',
      department: 'IT',
    };
    mockUsersService.findByCredential.mockResolvedValue(null);
    mockUsersService.create = jest.fn().mockResolvedValue({
      id: '2',
      ...dto,
    });
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashedpassword');

    const req = { session: {} };
    const result = await service.signup(dto, req);

    expect(mockUsersService.create).toHaveBeenCalledWith({
      ...dto,
      password: 'hashedpassword',
    });
    expect(req.session.user).toEqual({
      id: '2',
      ...dto,
    });
    expect(result).toEqual({ id: '2', message: 'Signup successful' });
  });

  it('should throws if user already exists on signup', async () => {
    const dto = {
      username: 'existinguser',
      email: 'existinguser@example.com',
    };
    mockUsersService.findByCredential.mockResolvedValue({
      id: '1',
      ...dto,
    });

    const req = { session: {} };
    await expect(service.signup(dto, req)).rejects.toThrow(HttpException);
  });
});
