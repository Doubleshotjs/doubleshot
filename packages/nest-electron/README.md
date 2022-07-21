# @doubleshot/nest-electron

## Description

It is a [nestjs](https://nestjs.com/) module that provides integration with [electron](https://www.electronjs.org/). 

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

Module registration:

```ts
import { Module } from '@nestjs/common'
import { ElectronModule } from '@doubleshot/nest-electron'
import { BrowserWindow } from 'electron'
import { AppController } from './app.controller'
import { AppService } from './app.service'

@Module({
  imports: [ElectronModule.registerAsync({
    useFactory: async () => {
      const win = new BrowserWindow()

      win.loadURL('http://localhost:3000')

      return { win }
    },
  })],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
```

Provides an injected service `ElectronService`:

```ts
import type { ElectronService } from '@doubleshot/nest-electron'
import { Injectable } from '@nestjs/common'

@Injectable()
export class AppService {
  constructor(
    private readonly electronService: ElectronService,
  ) { }

  public getWindowTitle() {
    const win = this.electronService.getWindow()

    return win.title
  }
}
```

## License

MIT License © 2022 [Archer Gu](https://github.com/archergu)