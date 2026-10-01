import {
  Injectable,
  NotFoundException,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { eq, and, inArray, desc, or } from 'drizzle-orm';
import { DatabaseService } from '../../database/database.service';
import { tables } from '../../database/schema/tables.schema';
import { orders } from '../../database/schema/orders.schema';
import { serviceRequests } from '../../database/schema/service-requests.schema';
import { ServiceRequestInput } from '../../common/schemas/api.schemas';
import { CallWaiterDto } from './dto/call-waiter.dto';
import { RequestBillDto } from './dto/request-bill.dto';
import { TablesService } from '../tables/tables.service';
import { RealtimeService } from '../realtime/realtime.service';

@Injectable()
export class ServiceRequestsService {
  private readonly logger = new Logger(ServiceRequestsService.name);

  // In-memory anti-spam rate limiting map: tableNumber -> timestamp when cooldown expires
  private waiterCooldownMap = new Map<string, number>();

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly configService: ConfigService,
    private readonly tablesService: TablesService,
    private readonly realtimeService: RealtimeService,
  ) {}

  /**
   * 4. POST /api/service-request
   * Handles 'call_waiter' and 'bill_request'.
   */
  async handleServiceRequest(dto: ServiceRequestInput) {
    // 1. Verify Table Existence
    const table = await this.tablesService.findTable(dto.tableId);

    if (!table) {
      throw new NotFoundException({
        success: false,
        error: 'TABLE_NOT_FOUND',
        message: `Table "${dto.tableId}" not found.`,
      });
    }

    const requestId = `sr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    if (dto.type === 'call_waiter') {
      const cooldownDurationSec = this.configService.get<number>('WAITER_COOLDOWN_SECONDS', 120);
      const now = Date.now();

      // Check Cooldown Expiry
      const cooldownUntil = this.waiterCooldownMap.get(table.tableNumber);
      if (cooldownUntil && cooldownUntil > now) {
        const remainingSeconds = Math.ceil((cooldownUntil - now) / 1000);
        const minutes = Math.floor(remainingSeconds / 60);
        const seconds = (remainingSeconds % 60).toString().padStart(2, '0');

        throw new HttpException(
          {
            success: false,
            error: 'COOLDOWN_ACTIVE',
            remainingSeconds,
            message: `Please wait ${minutes}:${seconds} before calling staff again.`,
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      // Set Cooldown
      this.waiterCooldownMap.set(table.tableNumber, now + cooldownDurationSec * 1000);

      await this.databaseService.db.insert(serviceRequests).values({
        id: requestId,
        tableId: table.id,
        tableNumber: table.tableNumber,
        type: 'call_waiter',
        status: 'pending',
        reason: dto.reason || 'general',
        customNote: dto.customNote,
      });

      this.logger.log(`Waiter called for Table ${table.tableNumber} (Reason: ${dto.reason || 'general'})`);

      // Broadcast service:call_waiter to "pos_staff"
      this.realtimeService.broadcastCallWaiter({
        requestId,
        tableNumber: table.tableNumber,
        tableId: table.id,
        reason: dto.reason || 'general',
        customNote: dto.customNote,
        timestamp: Date.now(),
      });

      return {
        requestId,
        tableId: table.id,
        tableNumber: table.tableNumber,
        type: 'call_waiter',
        status: 'pending',
        cooldownSeconds: cooldownDurationSec,
        message: 'Staff notified, someone will assist you shortly.',
      };
    } else {
      // bill_request
      const activeOrders = await this.databaseService.db.query.orders.findMany({
        where: and(
          eq(orders.tableId, table.id),
          inArray(orders.status, ['pending', 'accepted', 'preparing', 'ready', 'served']),
        ),
      });

      const tableTotal = activeOrders.reduce((acc, curr) => acc + curr.totalAmount, 0);

      // Update Table Status to 'bill_requested'
      await this.databaseService.db
        .update(tables)
        .set({ status: 'bill_requested' })
        .where(eq(tables.id, table.id));

      await this.databaseService.db.insert(serviceRequests).values({
        id: requestId,
        tableId: table.id,
        tableNumber: table.tableNumber,
        type: 'bill_request',
        status: 'pending',
        paymentMethod: dto.paymentMethod || 'cash',
        splitCount: dto.splitCount || 1,
        customNote: dto.customNote,
      });

      this.logger.log(`Bill requested for Table ${table.tableNumber}. Total: Rs. ${tableTotal}`);

      // Broadcast service:bill_request to "pos_staff"
      this.realtimeService.broadcastBillRequest({
        requestId,
        tableNumber: table.tableNumber,
        tableId: table.id,
        paymentMethod: dto.paymentMethod || 'cash',
        splitCount: dto.splitCount || 1,
        tableTotal,
        customNote: dto.customNote,
        timestamp: Date.now(),
      });

      return {
        requestId,
        tableId: table.id,
        tableNumber: table.tableNumber,
        type: 'bill_request',
        status: 'pending',
        tableTotal,
        paymentMethod: dto.paymentMethod || 'cash',
        message: 'POS alerted: Table bill requested. A server is printing your check.',
      };
    }
  }

  // Legacy helper
  async callWaiter(dto: CallWaiterDto) {
    return this.handleServiceRequest({
      tableId: dto.tableId,
      type: 'call_waiter',
      reason: dto.reason,
      customNote: dto.customNote,
    });
  }

  // Legacy helper
  async requestBill(dto: RequestBillDto) {
    return this.handleServiceRequest({
      tableId: dto.tableId,
      type: 'bill_request',
      paymentMethod: dto.paymentMethod as any,
      splitCount: dto.splitCount,
      customNote: dto.customNote,
    });
  }

  async getActiveRequests() {
    const requests = await this.databaseService.db.query.serviceRequests.findMany({
      where: eq(serviceRequests.status, 'pending'),
      orderBy: [desc(serviceRequests.createdAt)],
    });

    return requests;
  }
}
