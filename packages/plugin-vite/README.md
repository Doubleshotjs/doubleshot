# vite-plugin-doubleshot

## Description

It's a [Vite](https://vitejs.dev/) plugin with integrated [@doubleshot/builder](https://github.com/archergu/doubleshot/tree/main/packages/builder#readme). You can use it to help Vite quickly build node backend or electron's main process code.

> **Warning**: this project is in early stage, do not use in production environment

## Install

```shell
npm i vite-plugin-doubleshot -D
# Or Yarn
yarn add vite-plugin-doubleshot -D
# Or PNPM
pnpm add vite-plugin-doubleshot -D
```

## Usage

In Vite config file(eg. `.vite.config.ts`), add this plugin:

```ts
import { defineConfig } from 'vite'
import { VitePluginDoubleshot } from 'vite-plugin-doubleshot'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    VitePluginDoubleshot({
      type: 'electron',
      main: 'dist/main/index.js',
      entry: 'src/index.ts',
      outDir: 'dist/main',
      external: ['electron']
    }),
  ]
})
```

You can find more configurations through the type definition file.

## License

MIT License © 2022 [Archer Gu](https://github.com/archergu)
