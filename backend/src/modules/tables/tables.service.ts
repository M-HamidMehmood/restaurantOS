import { Injectable, NotFoundException } from '@nestjs/common';
import { eq, and, inArray, or } from 'drizzle-orm';
import { DatabaseService } from '../../database/database.service';
import { tables } from '../../database/schema/tables.schema';
import { orders } from '../../database/schema/orders.schema';

@Injectable()
export class TablesService {
  constructor(private readonly databaseService: DatabaseService) {}

  normalizeTableNumber(rawTableId: string): string {
    const trimmed = rawTableId.trim().toUpperCase();
    if (/^T-\d+$/i.test(trimmed)) {
      return trimmed;
    }
    const match = trimmed.match(/^T?0*(\d+)$/i);
    if (match) {
      const num = parseInt(match[1], 10);
      return `T-${num.toString().padStart(2, '0')}`;
    }
    return trimmed;
  }

  async findTable(identifier: string) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
    const normalized = this.normalizeTableNumber(identifier);
    const slug = identifier.trim().toLowerCase();

    if (isUuid) {
      return this.databaseService.db.query.tables.findFirst({
        where: or(eq(tables.id, identifier), eq(tables.tableNumber, normalized), eq(tables.qrSlug, slug)),
      });
    }

    return this.databaseService.db.query.tables.findFirst({
      where: or(eq(tables.tableNumber, normalized), eq(tables.qrSlug, slug)),
    });
  }

  async getTableStatus(tableIdentifier: string) {
    const table = await this.findTable(tableIdentifier);

    if (!table) {
      throw new NotFoundException({
        success: false,
        error: 'TABLE_NOT_FOUND',
        message: `Table "${tableIdentifier}" is not registered in the system. Please consult cafe staff.`,
      });
    }

    // Check active non-completed orders for this table
    const activeOrdersList = await this.databaseService.db.query.orders.findMany({
      where: and(
        eq(orders.tableId, table.id),
        inArray(orders.status, ['pending', 'accepted', 'preparing', 'ready', 'served']),
      ),
    });

    return {
      success: true,
      data: {
        id: table.id,
        tableNumber: table.tableNumber,
        qrSlug: table.qrSlug,
        displayName: table.displayName || `Table ${table.tableNumber.replace('T-', '')}`,
        status: table.status,
        hasActiveOrders: activeOrdersList.length > 0,
        activeOrdersCount: activeOrdersList.length,
        waiterCooldownRemaining: 0,
        isBillRequested: table.status === 'bill_requested',
      },
    };
  }

  async getAllTables() {
    const all = await this.databaseService.db.query.tables.findMany({
      orderBy: (tbls, { asc }) => [asc(tbls.tableNumber)],
    });

    return {
      success: true,
      count: all.length,
      tables: all,
    };
  }
}
