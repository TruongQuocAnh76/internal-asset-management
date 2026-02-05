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
import { getRequestsDto } from './dto/get-request.dto';
import { CurrentUser } from 'src/core/auth/decorator/current-user.decorator';

@Controller('requests')
export class RequestsController {
  constructor(private requestService: RequestsService) {}
  @Post()
  @UseGuards(SessionAuthGuard)
  createRequest(
    @Body(new ZodValidationPipe(CreateRequestDto)) body: CreateRequestDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.requestService.createRequest(body, userId);
  }

  @Get()
  @UseGuards(SessionAuthGuard)
  getRequests(@Query() query: getRequestsDto) {
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
    @Query('id') request_id: string,
    @Body(new ZodValidationPipe(CreateRequestDto)) body: CreateRequestDto,
  ) {
    return this.requestService.editRequest(userId, request_id, body);
  }

  @Put('/approve')
  @UseGuards(SessionAuthGuard)
  @Permission('request:approve')
  @UseGuards(PermissionAuthGuard)
  approveRequest(
    @Query('id') requestId: string,
    @CurrentUser('id') userId: string,
    @Body() body: any,
  ) {
    const assetId = body.asset_id;
    return this.requestService.approveRequest(userId, requestId, assetId);
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
  ) {
    return this.requestService.provideRequest(userId, requestId);
  }

  @Put('/return')
  @UseGuards(SessionAuthGuard)
  @UseGuards(PermissionAuthGuard)
  returnRequest(
    @Query('id') requestId: string,
    @Body() body: any,
    @CurrentUser('id') userId: string,
  ) {
    const assetId = body.asset_id;
    return this.requestService.returnRequest(requestId, assetId, userId);
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
