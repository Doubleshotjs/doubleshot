# @doubleshot/nest-electron-ipc-transport

> **Note**: This is an archive and may not be updated. This package has been integrated into [@doubleshot/nest-electron](https://github.com/archergu/doubleshot/tree/main/packages/nest-electron#readme).

## Description

It is an electron ipc transport for [nestjs](https://nestjs.com/) that provides simple ipc communication.

> **Warning**: this project is in early stage, do not use in production environment.

## Install

```shell
npm i @doubleshot/nest-electron-ipc-transport
# Or Yarn
yarn add @doubleshot/nest-electron-ipc-transport
# Or PNPM
pnpm add @doubleshot/nest-electron-ipc-transport
```

## Usage

Nestjs main file:

```ts
import { NestFactory } from '@nestjs/core'
import type { MicroserviceOptions } from '@nestjs/microservices'
import { app } from 'electron'
import { ElectronIpcTransport } from '@doubleshot/nest-electron-ipc-transport'
import { AppModule } from './app.module'

async function bootstrap() {
  try {
    await app.whenReady()

    const nestApp = await NestFactory.createMicroservice<MicroserviceOptions>(
      AppModule,
      {
        strategy: new ElectronIpcTransport(),
      },
    )

    await nestApp.listen()
  }
  catch (error) {
    app.quit()
  }
}

bootstrap()
```

This transport depends on the nestjs microservice, so you have to install it first:

```shell
pnpm install @nestjs/microservices
```


## License

MIT License © 2022 [Archer Gu](https://github.com/archergu)