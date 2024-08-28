<p align="center">
    <img width="200" src="./DoubleShot.png" alt="DoubleShot logo">
</p>

<p align="center">
Hi, give me a doubleshot ☕.
<p>
<p align="center">
A split node backend and electron main process.
<p>

<br>

## Description

Doubleshot is a collection of tools for integrating the nodejs backend framework with electron to build a desktop application. At some point in the future, you can simply and quickly split it up and convert it to a web application.

A software engineer's time is precious, and I hope that one set of code can be applied to two different applications with minor modifications. So we can have more time to enjoy a cup of coffee. 😀

## Features

- 🏃‍ A [Runner](https://github.com/Doubleshotjs/doubleshot/tree/main/packages/runner) to start and build both the frontend (renderer) and backend (main).
- 🔨 A [Builder](https://github.com/Doubleshotjs/doubleshot/tree/main/packages/builder) to run/build electron main process or node backend.
- 🛻 An [electron ipc transport](https://github.com/Doubleshotjs/doubleshot/blob/main/packages/nest-electron/src/electron.transport.ts) for [nestjs](https://nestjs.com/) that provides simple ipc communication.
- 🪟 An [electron module](https://github.com/Doubleshotjs/doubleshot/blob/main/packages/nest-electron/src/electron.module.ts) for [nestjs](https://nestjs.com/) to launch electron windows.
- 😎 Very easy integration of electron and node.
- ⚡ Quickly split and convert between C/S and B/S.
- ⏩ Quick start and build, powered by [tsup](https://tsup.egoist.sh/) and [electron-builder](https://www.electron.build/)

> **Warning**: this project is in early stage, do not use in production environment

## License

MIT License © 2022 [Archer Gu](https://github.com/archergu)
