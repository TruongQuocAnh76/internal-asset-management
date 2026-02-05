import {
  Controller,
  Post,
  Put,
  Query,
  Body,
  UseGuards,
  Req,
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
  approveRequest(
    @Query('id') requestId: string,
    @Req() req: Request,
    @Body() body: any,
  ) {
    const userId = (req as any).user.id;
    const assetId = body.asset_id;
    return this.requestService.approveRequest(userId, requestId, assetId);
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
  @Permission('request:provided')
  @UseGuards(PermissionAuthGuard)
  provideRequest(@Query('id') requestId: string, @Req() req: Request) {
    const userId = (req as any).user.id;
    return this.requestService.provideRequest(userId, requestId);
  }

  @Put('/return')
  @UseGuards(SessionAuthGuard)
  @UseGuards(PermissionAuthGuard)
  returnRequest(@Query('id') requestId: string, @Body() body: any) {
    const assetId = body.asset_id;
    return this.requestService.returnRequest(requestId, assetId);
  }

  @Put('/cancel')
  @UseGuards(SessionAuthGuard)
  @UseGuards(PermissionAuthGuard)
  cancelRequest(@Query('id') requestId: string) {
    return this.requestService.cancelRequest(requestId);
  }
}
