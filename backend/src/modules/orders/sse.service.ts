import { Injectable } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';

export interface OrderStatusEvent {
  orderId: string;
  tableId: string;
  status: string;
  estimatedMinutes?: number;
  message: string;
  timestamp: number;
}

export interface StaffStreamEvent {
  event: 'order:new' | 'service:call_waiter' | 'service:bill_request' | 'order:status_updated' | 'menu:item_toggled';
  data: any;
  timestamp: number;
}

@Injectable()
export class SseService {
  private events$ = new Subject<OrderStatusEvent>();
  private staffEvents$ = new Subject<StaffStreamEvent>();

  emitStatus(event: OrderStatusEvent) {
    this.events$.next(event);
  }

  emitStaffEvent(event: StaffStreamEvent) {
    this.staffEvents$.next(event);
  }

  subscribeToStaff(): Observable<{ data: StaffStreamEvent }> {
    return this.staffEvents$.pipe(
      map((event) => ({ data: event })),
    );
  }

  subscribeToOrder(orderId: string): Observable<{ data: OrderStatusEvent }> {
    return this.events$.pipe(
      filter((event) => event.orderId === orderId),
      map((event) => ({ data: event })),
    );
  }

  subscribeToTable(tableId: string): Observable<{ data: OrderStatusEvent }> {
    return this.events$.pipe(
      filter((event) => event.tableId.toUpperCase() === tableId.toUpperCase()),
      map((event) => ({ data: event })),
    );
  }
}

