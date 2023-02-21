import type { ApplicationConfig } from '@nestjs/core'
import { NestFactory } from '@nestjs/core'
import type { NestMicroserviceOptions } from '@nestjs/common/interfaces/microservices/nest-microservice-options.interface'
import type { INestMicroservice } from '@nestjs/common'
import { IpcExceptionsFilter } from './transport'

// hack to set IpcExceptionsFilter to the global filters
const { createMicroservice } = NestFactory
NestFactory.createMicroservice = async function<T extends object>(
  module: any,
  options?: NestMicroserviceOptions & T,
): Promise<INestMicroservice> {
  const app = await createMicroservice.call(this, module, options)
  // private property, so we have to cast to any
  const applicationConfig = (app as any).applicationConfig as ApplicationConfig
  const globalFilters = applicationConfig.getGlobalFilters()
  // use unshift to make sure IpcExceptionsFilter is the first filter
  globalFilters.unshift(new IpcExceptionsFilter())

  return app
}
