import { Catch } from '@nestjs/common'
import { of } from 'rxjs'
import type { Observable } from 'rxjs'
import type { ExceptionFilter } from '@nestjs/common'

@Catch() // catch all exception
export class AllExecptionFilter implements ExceptionFilter {
  catch(exception: any): Observable<any> {
    return of({
      code: 1,
      message: exception.message,
      ...exception,
    })
  }
}
