import {
  Controller,
  Post,
  Put,
  Query,
  Body,
  UseGuards,
  Req,
  Get,
} from '@nestjs/common';
import { RequestsService } from './requests.service';
import { ZodValidationPipe } from 'nestjs-zod';
import { CreateRequestDto } from './dto/create-request.dto';
import { SessionAuthGuard } from 'src/core/auth/guards/session-auth.guard';
import { PermissionAuthGuard } from 'src/core/auth/guards/permission-auth.guard';
import { Permission } from 'src/core/auth/decorator/permission.decorator';
import { BorrowStatus } from '@prisma/client';

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
  getRequests(
    @Query('status') status?: BorrowStatus,
    @Query('asset_id') asset_id?: string,
    @Query('requester_id') requester_id?: string,
    @Query('filter') filter?: string,
    @Query('sort') sort?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.requestService.getRequests(status, asset_id, requester_id, filter, sort, page, limit);
  }

  @Put()
  @UseGuards(SessionAuthGuard)
  @UseGuards(PermissionAuthGuard)
  @Permission('request:edit')
  editRequest(
    @Req() req: Request,
    @Query('id') request_id: string,
    @Body(new ZodValidationPipe(CreateRequestDto)) body: CreateRequestDto,
  ) {
    const userId = (req as any).user.id;
    return this.requestService.editRequest(userId, request_id, body);
  }

  @Put('/approve')
  @UseGuards(SessionAuthGuard)
  @Permission('request:approve')
  @UseGuards(PermissionAuthGuard)
  approveRequest(@Query('id') requestId: string, @Req() req: Request) {
    const userId = (req as any).user.id;
    return this.requestService.approveRequest(userId, requestId);
  }

  @Put('/reject')
  @UseGuards(SessionAuthGuard)
  @Permission('request:approve')
  @UseGuards(PermissionAuthGuard)
  rejectRequest(@Query('id') requestId: string) {
    return this.requestService.rejectRequest(requestId);
  }

  @Put('/provide')
  @UseGuards(SessionAuthGuard)
  @Permission('request:provide')
  @UseGuards(PermissionAuthGuard)
  provideRequest(@Query('id') requestId: string, @Req() req: Request) {
    const userId = (req as any).user.id;
    return this.requestService.provideRequest(userId, requestId);
  }

  @Put('/return')
  @UseGuards(SessionAuthGuard)
  @Permission('request:return')
  @UseGuards(PermissionAuthGuard)
  returnRequest(@Query('id') requestId: string) {
    return this.requestService.returnRequest(requestId);
  }

  @Put('/cancel')
  @UseGuards(SessionAuthGuard)
  @Permission('request:cancel')
  @UseGuards(PermissionAuthGuard)
  cancelRequest(@Query('id') requestId: string) {
    return this.requestService.cancelRequest(requestId);
  }
}
