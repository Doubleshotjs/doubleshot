# @doubleshot/runner

## Description
Runner is a [concurrently](https://github.com/open-cli-tools/concurrently) wrapper that helps you execute commands in parallel.

> **Warning**: this project is in early stage, do not use in production environment

## Features

- 🛤️ Parallel commands, powered by [concurrently](https://github.com/open-cli-tools/concurrently).
- 🌈 Nice command line colors.
- 🔪 kill others when exiting.
- 🚗 Driven by configuration file.
- 📦 Support electron packaging.
- 💡 Support stand-alone use.

## Install

```shell
npm i @doubleshot/runner -D
# Or Yarn
yarn add @doubleshot/runner -D
# Or PNPM
pnpm add @doubleshot/runner -D
```

> **Note**: You may need to add `-W` flag to install it in a monorepo workspace.

## Usage

Runner must be driven by a configuration file, configuration file like `dsr.config.ts` (`'.js' | '.cjs' | '.mjs'`) is also available:
```ts
import { defineConfig } from '@doubleshot/runner'

export default defineConfig({
  run: [
    {
      name: 'renderer',
      cwd: 'packages/frontend',
      commands: {
        dev: 'npm run dev',
        build: 'npm run build'
      }
    },
    {
      name: 'electron',
      cwd: 'packages/backend',
      commands: {
        dev: 'npm run dev',
        build: 'npm run build'
      }
    }
  ]
})
```
You can configure items that need to be executed in parallel under the `run` field, and under the `commands` field, commands with the same name will be executed together. For example: `npx dsr dev`.

With the above configuration, it will execute `npm run dev` in both `packages/frontend` and `packages/backend` directories.You have to implement the above commands yourself, Runner is just a parallel executor.

You can find more configurations through the type definition file.


## License

MIT License © 2022 [Archer Gu](https://github.com/archergu)