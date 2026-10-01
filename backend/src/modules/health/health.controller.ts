import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DatabaseService } from '../../database/database.service';
import { RealtimeService } from '../realtime/realtime.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Health')
@Controller('api/health')
export class HealthController {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly realtimeService: RealtimeService,
  ) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'System health check, database, and realtime connectivity' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  async check() {
    const isDbConnected = await this.databaseService.ping();
    const realtimeInfo = this.realtimeService.getRealtimeStatus();

    return {
      status: isDbConnected ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: isDbConnected ? 'connected' : 'disconnected',
      realtime: realtimeInfo,
    };
  }
}
