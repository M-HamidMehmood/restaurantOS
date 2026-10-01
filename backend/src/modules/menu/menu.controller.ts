import { Controller, Get, Header } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MenuService } from './menu.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Menu & Catalog')
@Controller('api/menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Get()
  @Public()
  @Header('Cache-Control', 'public, max-age=180, stale-while-revalidate=60')
  @ApiOperation({ summary: 'Retrieve full catalog of food categories, dishes, and modifier options' })
  @ApiResponse({ status: 200, description: 'Menu catalog including restaurant metadata' })
  async getMenu() {
    return this.menuService.getMenu();
  }
}
