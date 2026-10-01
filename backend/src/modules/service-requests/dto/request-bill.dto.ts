import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import {
  paymentMethodEnum,
  PaymentMethod,
} from '../../../database/schema/service-requests.schema';

export class RequestBillDto {
  @ApiProperty({ example: 'T-04', description: 'Table number identifier' })
  @IsString()
  @IsNotEmpty()
  tableId: string;

  @ApiPropertyOptional({
    example: 'card',
    enum: paymentMethodEnum,
    description: 'Preferred settlement method',
  })
  @IsEnum(paymentMethodEnum)
  @IsOptional()
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional({ example: 2, description: 'Split bill quantity' })
  @IsInt()
  @Min(1)
  @IsOptional()
  splitCount?: number;

  @ApiPropertyOptional({ example: 'Need separate receipts for card' })
  @IsString()
  @IsOptional()
  customNote?: string;
}
