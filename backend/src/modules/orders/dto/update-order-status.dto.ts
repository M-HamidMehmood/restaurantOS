import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { orderStatusEnum, OrderStatus } from '../../../database/schema/orders.schema';

export class UpdateOrderStatusDto {
  @ApiProperty({
    example: 'preparing',
    enum: orderStatusEnum,
    description: 'Updated kitchen/order lifecycle status',
  })
  @IsEnum(orderStatusEnum)
  @IsNotEmpty()
  status: OrderStatus;

  @ApiPropertyOptional({ example: 8, description: 'Updated estimated preparation minutes' })
  @IsInt()
  @Min(0)
  @IsOptional()
  estimatedMinutes?: number;

  @ApiPropertyOptional({ example: 'Chef started grilling kebabs' })
  @IsString()
  @IsOptional()
  message?: string;
}
