import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  data: T;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, any> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        // If data is already structured with success or SSE stream, return as-is
        if (data && typeof data === 'object' && ('success' in data || 'stream' in data)) {
          return data;
        }
        return {
          success: true,
          data,
        };
      }),
    );
  }
}
