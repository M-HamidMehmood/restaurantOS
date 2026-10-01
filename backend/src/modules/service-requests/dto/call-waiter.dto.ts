import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { waiterReasonEnum, WaiterReason } from '../../../database/schema/service-requests.schema';

export class CallWaiterDto {
  @ApiProperty({ example: 'T-04', description: 'Table number identifier' })
  @IsString()
  @IsNotEmpty()
  tableId: string;

  @ApiPropertyOptional({
    example: 'water',
    enum: waiterReasonEnum,
    description: 'Specific assistance category',
  })
  @IsEnum(waiterReasonEnum)
  @IsOptional()
  reason?: WaiterReason;

  @ApiPropertyOptional({ example: 'Need 2 extra cold water glasses' })
  @IsString()
  @IsOptional()
  customNote?: string;
}
