import { Controller, Post, Get, Body, UseGuards, UsePipes } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ServiceRequestsService } from './service-requests.service';
import { Public } from '../../common/decorators/public.decorator';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  serviceRequestSchema,
  ServiceRequestInput,
} from '../../common/schemas/api.schemas';
import { CallWaiterDto } from './dto/call-waiter.dto';
import { RequestBillDto } from './dto/request-bill.dto';

@ApiTags('Service Actions & Alerts')
@Controller('api')
export class ServiceRequestsController {
  constructor(private readonly serviceRequestsService: ServiceRequestsService) {}

  /**
   * 4. POST /api/service-request
   * Handles 'call_waiter' and 'bill_request'.
   */
  @Post('service-request')
  @Public()
  @UsePipes(new ZodValidationPipe(serviceRequestSchema))
  @ApiOperation({ summary: "Dispatch service request ('call_waiter' or 'bill_request')" })
  @ApiResponse({ status: 201, description: 'Service request created' })
  @ApiResponse({ status: 404, description: 'Table not found' })
  @ApiResponse({ status: 429, description: 'Waiter cooldown active' })
  async createServiceRequest(@Body() body: ServiceRequestInput) {
    return this.serviceRequestsService.handleServiceRequest(body);
  }

  // Compatibility routes
  @Post('service/call-waiter')
  @Public()
  @ApiOperation({ summary: 'Alert waitstaff (legacy route)' })
  async callWaiter(@Body() dto: CallWaiterDto) {
    return this.serviceRequestsService.callWaiter(dto);
  }

  @Post('service/request-bill')
  @Public()
  @ApiOperation({ summary: 'Request bill checkout (legacy route)' })
  async requestBill(@Body() dto: RequestBillDto) {
    return this.serviceRequestsService.requestBill(dto);
  }

  @Get('service/active')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List pending waiter and billing calls (Staff view)' })
  async getActiveRequests() {
    return this.serviceRequestsService.getActiveRequests();
  }
}
