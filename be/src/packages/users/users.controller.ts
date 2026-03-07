import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ForbiddenException,
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { SessionAuthGuard } from 'src/core/auth/guards/session-auth.guard';
import { UseGuards } from '@nestjs/common';
import { SignupDto } from 'src/core/auth/dto/signup.dto';
import { CurrentUser } from 'src/core/auth/decorator/current-user.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(SessionAuthGuard)
  @Get('@me')
  @UseGuards(SessionAuthGuard)
  getProfile(@CurrentUser() user: any) {
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  @Post()
  @UseGuards(SessionAuthGuard)
  create(@Body() signupDto: SignupDto, @CurrentUser('id') userId: string) {
    return this.usersService.create(signupDto);
  }

  @Get()
  @UseGuards(SessionAuthGuard)
  findAll(@Query('search') search?: string) {
    return this.usersService.findAll(search);
  }

  @Get(':id')
  @UseGuards(SessionAuthGuard)
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(SessionAuthGuard)
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() user: any,
  ) {
    const isAdmin =
      user?.user_roles?.some((userRole) => userRole?.role?.name === 'Admin') ||
      false;

    if (!isAdmin) {
      throw new ForbiddenException('Only admins can update users');
    }

    return this.usersService.update(id, updateUserDto, user.id);
  }

  @Delete(':id')
  @UseGuards(SessionAuthGuard)
  remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.usersService.remove(id, userId);
  }
}
