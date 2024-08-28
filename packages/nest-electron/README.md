# @doubleshot/nest-electron

## Description

It is a [nestjs](https://nestjs.com/) module that provides integration with [electron](https://www.electronjs.org/). It also has an ipc transport that provides simple ipc communication.

> **Warning**: this project is in early stage, do not use in production environment

## Install

```shell
npm i @doubleshot/nest-electron
# Or Yarn
yarn add @doubleshot/nest-electron
# Or PNPM
pnpm add @doubleshot/nest-electron
```

## Usage

Nestjs bootstrap file:

```ts
import { NestFactory } from '@nestjs/core'
import type { MicroserviceOptions } from '@nestjs/microservices'
import { app } from 'electron'
import { ElectronIpcTransport } from '@doubleshot/nest-electron'
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
  catch {
    app.quit()
  }
}

bootstrap()
```

> **Note**: This transport depends on the nestjs microservice, so you have to install it first:

```shell
pnpm install @nestjs/microservices
```

Module registration:

```ts
import { Module } from '@nestjs/common'
import { ElectronModule } from '@doubleshot/nest-electron'
import { BrowserWindow } from 'electron'
import { AppController } from './app.controller'
import { AppService } from './app.service'

@Module({
  imports: [ElectronModule.registerAsync({
    // name: 'main', // default window names "main", you can skip the name if only provide one window
    useFactory: async () => {
      const win = new BrowserWindow()
      win.loadURL('http://localhost:3000')

      return win
    },
  })],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
```

Provides multi BrowserWindow(s):

```ts
import { Module } from '@nestjs/common'
import { ELECTRON_WINDOW_DEFAULT_NAME, ElectronModule } from '@doubleshot/nest-electron'
import { BrowserWindow } from 'electron'
import { AppController } from './app.controller'
import { AppService } from './app.service'

@Module({
  imports: [ElectronModule.registerAsync({
    name: [ELECTRON_WINDOW_DEFAULT_NAME, 'another-win'],
    useFactory: async () => {
      const mainWin = new BrowserWindow()
      mainWin.loadURL('http://localhost:3000')

      const anotherWin = new BrowserWindow()
      anotherWin.loadURL('http://localhost:3001')

      // correspond to the above names
      return [mainWin, anotherWin]
    }
  })],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
```

Provides injected BrowserWindow(s):

```ts
import { Window } from '@doubleshot/nest-electron'
import { Injectable } from '@nestjs/common'
import type { BrowserWindow } from 'electron'

@Injectable()
export class AppService {
  constructor(
    // default window names "main", you can skip the name
    @Window() private readonly win: BrowserWindow,
    // other window you should specify the name
    @Window('another-win') private readonly anotherWin: BrowserWindow,
  ) { }

  public getWindowTitle() {
    return this.win.title
  }
}
```

Bind ipc channel through the decorators:

```ts
import { Controller } from '@nestjs/common'
import { type IpcContext, IpcHandle, IpcOn } from '@doubleshot/nest-electron'
import { Ctx, Payload } from '@nestjs/microservices'

@Controller()
export class AppController {
  @IpcHandle('chat')
  chat(@Payload() msg: string, @Ctx() { ipcEvt: _ }: IpcContext) { // you can get ipc event object from @Ctx decorator
    console.log(`Get message from frontend: ${msg}`)
    return 'This is a message to frontend'
  }

  @IpcOn('print-log')
  printLog(@Payload() log: string) {
    console.log(`Get log: ${log}`)
  }

  @IpcOn('multi-params')
  sendMultiParams(@Payload() [param1, param2]) { // multi params will be an array from ipc channel
    console.log(`Get param1: ${param1}`)
    console.log(`Get param2: ${param2}`)
  }

  @IpcHandle('return-observable')
  returnObservable() {
    return of('Main process return an observable') // observable is also supported
  }
}
```

Export methods in preload/index.ts:

```ts
import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld(
  'electron',
  {
    chat: (msg: string): Promise<string> => ipcRenderer.invoke('chat', msg),
    printLog: (log: string): void => ipcRenderer.send('print-log', log),
    sendMultiParams: (param1: string, param2: string): void => ipcRenderer.send('multi-params', param1, param2),
    exit: (): void => ipcRenderer.send('exit'),
  },
)
```

IPC channel name will be combined with the controller route:

```ts
import { Controller } from '@nestjs/common'
import { IpcHandle, IpcOn } from '@doubleshot/nest-electron'

@Controller('app')
export class AppController {
  @IpcHandle('chat') // ipcRenderer.invoke('app/chat', msg); '/app/chat', 'app/chat/', '/app/chat/' are also available
  chat(@Payload() msg: string) {
    console.log(`Get message from frontend: ${msg}`)
    return 'This is a message to frontend'
  }

  @IpcOn('print-log') // ipcRenderer.send('app/print-log', msg),
  printLog(@Payload() log: string) {
    console.log(`Get log: ${log}`)
  }
}
```

## License

MIT License © 2022 [Archer Gu](https://github.com/archergu)
