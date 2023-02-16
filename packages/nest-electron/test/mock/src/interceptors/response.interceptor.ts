import { Injectable } from '@nestjs/common'
import { map } from 'rxjs/operators'
import type { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common'
import type { Observable } from 'rxjs'

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        return {
          code: 0,
          message: 'ok',
          data,
        }
      }),
    )
  }
}
