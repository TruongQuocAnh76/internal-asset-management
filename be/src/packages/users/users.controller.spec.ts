import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PrismaClient } from '@prisma/client';

describe('UsersController', () => {
  let controller: UsersController;

  const mockUsersService = {};
  const mockPrismaClient = {};
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: UsersService, useValue: mockUsersService },
        { provide: PrismaClient, useValue: mockPrismaClient },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
