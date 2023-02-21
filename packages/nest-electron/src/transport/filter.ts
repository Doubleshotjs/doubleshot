import type { ExceptionFilter } from '@nestjs/common'
import { Catch, Logger } from '@nestjs/common'

@Catch()
export class IpcExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(IpcExceptionsFilter.name)
  catch(exception: any) {
    this.logger.error(exception)
    throw exception
  }
}
