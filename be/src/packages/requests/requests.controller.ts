import {
  Controller,
  Post,
  Put,
  Query,
  Body,
  UseGuards,
  Get,
  Param,
} from '@nestjs/common';
import { RequestsService } from './requests.service';
import { ZodValidationPipe } from 'nestjs-zod';
import { CreateRequestDto } from './dto/create-request.dto';
import { SessionAuthGuard } from 'src/core/auth/guards/session-auth.guard';
import { PermissionAuthGuard } from 'src/core/auth/guards/permission-auth.guard';
import { Permission } from 'src/core/auth/decorator/permission.decorator';
import { GetRequestsDto } from './dto/get-request.dto';
import { CurrentUser } from 'src/core/auth/decorator/current-user.decorator';
import { RequestProvideDto } from './dto/provide-request.dto';

@Controller('requests')
export class RequestsController {
  constructor(private requestService: RequestsService) {}
  @Post()
  @UseGuards(SessionAuthGuard)
  createRequest(
    @Body(new ZodValidationPipe(CreateRequestDto)) body: CreateRequestDto,
  ) {
    return this.requestService.createRequest(body);
  }

  @Get()
  @UseGuards(SessionAuthGuard)
  getRequests(@Query() query: GetRequestsDto) {
    return this.requestService.getRequests(query);
  }

  @Get(':id')
  @UseGuards(SessionAuthGuard)
  getRequestById(@Param('id') requestId: string) {
    return this.requestService.getRequestById(requestId);
  }

  @Put()
  @UseGuards(SessionAuthGuard)
  @UseGuards(PermissionAuthGuard)
  @Permission('request:edit')
  editRequest(
    @CurrentUser('id') userId: string,
    @Query('id') requestId: string,
    @Body(new ZodValidationPipe(CreateRequestDto)) body: CreateRequestDto,
  ) {
    return this.requestService.editRequest(userId, requestId, body);
  }

  @Put('/approve')
  @UseGuards(SessionAuthGuard)
  @Permission('request:approve')
  @UseGuards(PermissionAuthGuard)
  approveRequest(
    @Query('id') requestId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.requestService.approveRequest(userId, requestId);
  }

  @Put('/reject')
  @UseGuards(SessionAuthGuard)
  @Permission('request:approve')
  @UseGuards(PermissionAuthGuard)
  rejectRequest(
    @Query('id') requestId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.requestService.rejectRequest(requestId, userId);
  }

  @Put('/provide')
  @UseGuards(SessionAuthGuard)
  @Permission('request:provided')
  @UseGuards(PermissionAuthGuard)
  provideRequest(
    @Query('id') requestId: string,
    @CurrentUser('id') userId: string,
    @Body(new ZodValidationPipe(RequestProvideDto)) body: RequestProvideDto,
  ) {
    return this.requestService.provideRequest(userId, requestId, body);
  }

  @Put('/return')
  @UseGuards(SessionAuthGuard)
  @UseGuards(PermissionAuthGuard)
  returnRequest(
    @Query('id') requestId: string,
    @Body() body: any,
    @CurrentUser('id') userId: string,
  ) {
    return this.requestService.returnRequest(requestId);
  }

  @Put('/cancel')
  @UseGuards(SessionAuthGuard)
  @UseGuards(PermissionAuthGuard)
  cancelRequest(
    @Query('id') requestId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.requestService.cancelRequest(requestId, userId);
  }
}
