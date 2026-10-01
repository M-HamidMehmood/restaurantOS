import { ApiProperty } from '@nestjs/swagger';

export class TableStatusDataDto {
  @ApiProperty({ example: 'T-04' })
  tableNumber: string;

  @ApiProperty({ example: 'Table 04' })
  displayName: string;

  @ApiProperty({ example: 'OCCUPIED', enum: ['AVAILABLE', 'OCCUPIED', 'BILLING', 'CLEANING'] })
  status: string;

  @ApiProperty({ example: true })
  hasActiveOrders: boolean;

  @ApiProperty({ example: 1 })
  activeOrdersCount: number;

  @ApiProperty({ example: 0 })
  waiterCooldownRemaining: number;

  @ApiProperty({ example: false })
  isBillRequested: boolean;
}

export class TableResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: TableStatusDataDto })
  data: TableStatusDataDto;
}
