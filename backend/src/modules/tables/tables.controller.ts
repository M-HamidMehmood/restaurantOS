import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { TablesService } from './tables.service';
import { Public } from '../../common/decorators/public.decorator';
import { TableResponseDto } from './dto/table-response.dto';

@ApiTags('Tables & Sessions')
@Controller('api/tables')
export class TablesController {
  constructor(private readonly tablesService: TablesService) {}

  @Get(':tableId')
  @Public()
  @ApiOperation({ summary: 'Validate table QR code and retrieve active dining session' })
  @ApiParam({ name: 'tableId', example: 'T-04', description: 'Table number identifier' })
  @ApiResponse({ status: 200, description: 'Table details and active session status', type: TableResponseDto })
  @ApiResponse({ status: 404, description: 'Table not registered' })
  async getTableStatus(@Param('tableId') tableId: string) {
    return this.tablesService.getTableStatus(tableId);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'List all restaurant tables and floor plan statuses' })
  @ApiResponse({ status: 200, description: 'List of all tables' })
  async getAllTables() {
    return this.tablesService.getAllTables();
  }
}
