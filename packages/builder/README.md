# @doubleshot/builder

## Description

Builder is a cli tool for quickly building node backend or electron main process. It's powered by [tsup](https://tsup.egoist.sh/), bundled through internal [esbuild](https://esbuild.github.io/), and decorators are supported by [swc](https://swc.rs/).

> **Note:** Builder is only suitable for building node and electron code, that is, files converted to CommonJS standards.

## Features

- ⚡ Fast start and bundled.
- 💟 TypeScript decorator available.
- ✅ Configure via file or command line.
- 📦 Support electron packaging.
- 💡 Support stand-alone use.

> **Warning**: this project is in early stage, do not use in production environment

## Install

```shell
npm i @doubleshot/builder -D
# Or Yarn
yarn add @doubleshot/builder -D
# Or PNPM
pnpm add @doubleshot/builder -D
```

## Usage

Use directly:

```shell
# development mode
npx dsb dev
# production mode
npx dsb build
```

Or through a script in `package.json`:

```json
{
  "scripts": {
    "dev": "dsb dev",
    "build": "dsb build"
  }
}
```

## Configuration

Configuration file like `dsb.config.ts` (`'.js' | '.cjs' | '.mjs'`) is also available:

```ts
import { defineConfig } from '@doubleshot/builder'

export default defineConfig({
  main: 'dist/main.js',
  entry: './src/main.ts',
  outDir: './dist',
  external: ['electron'],
  electron: {
    preload: {
      entry: './src/preload.ts'
    },
    rendererUrl: 'http://localhost:3000',
    waitTimeout: 5000,
  }
})
```

You can find more configurations through the type definition file.

## CLI Options

Cli options are also available, use `--help` to see them.

## License

MIT License © 2022 [Archer Gu](https://github.com/archergu)
