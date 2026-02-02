import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { SessionAuthGuard } from 'src/core/auth/guards/session-auth.guard';
import { UseGuards, Request } from '@nestjs/common';
import { SignupDto } from 'src/core/auth/dto/signup.dto';
import { AuthenticatedRequest } from './dto/authenticated-request.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(SessionAuthGuard)
  @Get('@me')
  @UseGuards(SessionAuthGuard)
  getProfile(@Request() req: AuthenticatedRequest) {
    return req.user;
  }

  @Post()
  @UseGuards(SessionAuthGuard)
  create(@Body() signupDto: SignupDto) {
    return this.usersService.create(signupDto);
  }

  @Get()
  @UseGuards(SessionAuthGuard)
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @UseGuards(SessionAuthGuard)
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(SessionAuthGuard)
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(+id, updateUserDto);
  }

  @Delete(':id')
  @UseGuards(SessionAuthGuard)
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }
}
