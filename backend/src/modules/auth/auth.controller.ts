import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser, SupabaseUser } from '../../common/decorators/current-user.decorator';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';

@ApiTags('Authentication')
@Controller('api/auth')
export class AuthController {
  @Get('me')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated Supabase user profile' })
  @ApiResponse({ status: 200, description: 'Authenticated user claims and metadata' })
  @ApiResponse({ status: 401, description: 'Unauthorized / Invalid Bearer token' })
  getProfile(@CurrentUser() user: SupabaseUser) {
    return {
      success: true,
      user,
    };
  }
}
