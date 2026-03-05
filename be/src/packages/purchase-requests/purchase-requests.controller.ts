import { Controller, Get, Query, UseGuards, Body, Post, Param } from '@nestjs/common';
import { PurchaseRequestsService } from './purchase-requests.service';
import { SessionAuthGuard } from 'src/core/auth/guards/session-auth.guard';
import { GetPurchaseRequestParam } from './dto/get-purchase-request-param.dto';
import { CreatePurchaseRequestDto } from './dto/create-purchase-request.dto';
import { CreateAssetDto } from '../assets/dto/create-asset.dto';
import { Permission } from 'src/core/auth/decorator/permission.decorator';

@Controller('purchase-requests')
export class PurchaseRequestsController {
  constructor(private readonly purchaseRequestsService: PurchaseRequestsService) {}

  @Get()
  @UseGuards(SessionAuthGuard)
  getPurchaseRequests(
    @Query() query: GetPurchaseRequestParam,
  ) {
    return this.purchaseRequestsService.getPurchaseRequests(query);
  }

  @Get(':id')
  @UseGuards(SessionAuthGuard)
  getPurchaseRequestById(@Param('id') id: string) {
    return this.purchaseRequestsService.getPurchaseRequestById(id);
  }

  @Post()
  @UseGuards(SessionAuthGuard)
  createPurchaseRequest(@Body() body: CreatePurchaseRequestDto) {
    return this.purchaseRequestsService.createPurchaseRequest(body);
  }

  @Post(':id/tl-approve')
  @UseGuards(SessionAuthGuard)
  @Permission('purchase-requests:tl-approve')
  tlApprove(@Param('id') id: string) {
    return this.purchaseRequestsService.tlApprove(id);
  }

  @Post(':id/bod-approve')
  @UseGuards(SessionAuthGuard)
  @Permission('purchase-requests:bod-approve')
  bodApprove(@Param('id') id: string) {
    return this.purchaseRequestsService.bodApprove(id);
  }

  @Post(':id/reject')
  @UseGuards(SessionAuthGuard)
  @Permission('purchase-requests:reject')
  reject(@Param('id') id: string) {
    return this.purchaseRequestsService.reject(id);
  }

  @Post(':id/receive')
  @UseGuards(SessionAuthGuard)
  @Permission('purchase-requests:receive')
  receive(@Param('id') id: string, @Body() body: CreateAssetDto) {
    return this.purchaseRequestsService.receive(id, body);
  }
}
