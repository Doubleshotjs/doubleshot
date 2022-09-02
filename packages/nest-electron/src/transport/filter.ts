import type { ExceptionFilter } from '@nestjs/common'
import { Catch } from '@nestjs/common'

@Catch()
export class IpcExceptionsFilter implements ExceptionFilter {
  catch(exception: any) {
    throw exception
  }
}
