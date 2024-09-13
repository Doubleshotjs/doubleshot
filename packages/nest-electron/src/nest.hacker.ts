import type { INestApplication, INestMicroservice, NestApplicationOptions, NestHybridApplicationOptions } from '@nestjs/common'
import type { NestMicroserviceOptions } from '@nestjs/common/interfaces/microservices/nest-microservice-options.interface'
import type { AbstractHttpAdapter, ApplicationConfig } from '@nestjs/core'
import type { CustomTransportStrategy, Server } from '@nestjs/microservices'
import { NestFactory } from '@nestjs/core'
import { ElectronIpcTransport } from './electron.transport'
import { IpcExceptionsFilter } from './transport'
import { isElectron } from './utils'

if (isElectron) {
  function setFilter(app: INestMicroservice, strategy?: Server & CustomTransportStrategy) {
    if (strategy && strategy instanceof ElectronIpcTransport) {
      // private property, so we have to cast to any
      const applicationConfig = (app as any).applicationConfig as ApplicationConfig
      const globalFilters = applicationConfig.getGlobalFilters()
      // use unshift to make sure IpcExceptionsFilter is the first filter
      globalFilters.unshift(new IpcExceptionsFilter())
    }
  }

  // hack to set IpcExceptionsFilter to the global filters
  const { create, createMicroservice } = NestFactory

  NestFactory.create = async function<T extends INestApplication = INestApplication>(
    module: any,
    serverOrOptions?: AbstractHttpAdapter | NestApplicationOptions,
    options?: NestApplicationOptions,
  ): Promise<T> {
    const app = await create.call(this, module, serverOrOptions, options) as T
    const { connectMicroservice } = app

    app.connectMicroservice = function<T extends object = any>(
      options: T,
      hybridOptions?: NestHybridApplicationOptions,
    ): INestMicroservice {
      const instance = connectMicroservice.call(this, options, hybridOptions) as INestMicroservice
      setFilter(instance, (options as any)?.strategy)
      return instance
    }

    return app
  }

  NestFactory.createMicroservice = async function<T extends object>(
    module: any,
    options?: NestMicroserviceOptions & T,
  ): Promise<INestMicroservice> {
    const app = await createMicroservice.call(this, module, options) as INestMicroservice
    setFilter(app, (options as any)?.strategy)
    return app
  }
}
