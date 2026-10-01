import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class SelectedModifierDto {
  @ApiProperty({ example: 'spice_level' })
  @IsString()
  @IsNotEmpty()
  groupId: string;

  @ApiProperty({ example: 'Spice Level' })
  @IsString()
  @IsNotEmpty()
  groupName: string;

  @ApiProperty({ example: 'spice_teekha' })
  @IsString()
  @IsNotEmpty()
  optionId: string;

  @ApiProperty({ example: 'Teekha (Extra Green Chili & Chaat)' })
  @IsString()
  @IsNotEmpty()
  optionName: string;

  @ApiProperty({ example: 20 })
  @IsInt()
  @Min(0)
  price: number;
}

export class OrderItemDetailDto {
  @ApiProperty({ example: 'burger-anda-shami' })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({ example: 'Anda Shami Burger' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 280 })
  @IsInt()
  @Min(0)
  price: number;
}

export class OrderItemDto {
  @ApiPropertyOptional({ example: 'burger-anda-shami_opt_1' })
  @IsString()
  @IsOptional()
  cartItemId?: string;

  @ApiProperty({ type: OrderItemDetailDto })
  @ValidateNested()
  @Type(() => OrderItemDetailDto)
  item: OrderItemDetailDto;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({ type: [SelectedModifierDto], default: [] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SelectedModifierDto)
  selectedModifiers: SelectedModifierDto[];

  @ApiPropertyOptional({ example: 'Extra crispy, no onions' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ example: 360 })
  @IsNumber()
  unitPrice: number;

  @ApiProperty({ example: 360 })
  @IsNumber()
  totalPrice: number;
}

export class CreateOrderDto {
  @ApiProperty({ example: 'T-04', description: 'Table number identifier' })
  @IsString()
  @IsNotEmpty()
  tableId: string;

  @ApiProperty({ type: [OrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ApiProperty({ example: 396, description: 'Client estimated total in whole PKR' })
  @IsNumber()
  totalAmount: number;

  @ApiPropertyOptional({ example: 'Serve chai after food' })
  @IsString()
  @IsOptional()
  notes?: string;
}
