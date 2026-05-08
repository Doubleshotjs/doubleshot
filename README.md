<div align="center">
  <img width="200" src="./DoubleShot.png" alt="DoubleShot logo">

# Doubleshot

[![License](https://img.shields.io/github/license/Doubleshotjs/doubleshot)](./LICENSE)
[![Stars](https://img.shields.io/github/stars/Doubleshotjs/doubleshot?style=social)](https://github.com/Doubleshotjs/doubleshot/stargazers)
[![Node.js](https://img.shields.io/badge/node-%3E%3D22-brightgreen)](https://nodejs.org/)
[![Package manager](https://img.shields.io/badge/pnpm-11-orange)](https://pnpm.io/)

A toolkit for building Electron desktop apps with a split Node.js backend, so one codebase can evolve toward both desktop and web delivery.
</div>

## Table of Contents

- [Why Doubleshot exists](#why-doubleshot-exists)
- [What you get](#what-you-get)
- [Packages](#packages)
- [Installation](#installation)
- [Usage](#usage)
- [Development workflow](#development-workflow)
- [When to use it](#when-to-use-it)
- [Project status](#project-status)
- [License](#license)

## Why Doubleshot exists

Doubleshot helps developers share more code between an Electron application and a traditional backend architecture. The goal is simple: spend less time rebuilding the same infrastructure twice, and keep the path open to later split a desktop-first app into a browser-delivered app.

## What you get

- **Shared tooling** for Electron main-process and backend builds
- **A coordinated runner** for starting frontend and backend pieces together
- **NestJS-focused integrations** for Electron IPC and window bootstrapping
- **Fast build workflow** powered by `tsdown` and `electron-builder`
- **A monorepo structure** that keeps the desktop and service layers aligned

## Packages

| Package | Purpose |
|---|---|
| `packages/runner` | Starts and builds frontend and backend together |
| `packages/builder` | Runs or builds the Electron main process or Node backend |
| `packages/nest-electron` | Provides Electron transport and module helpers for NestJS |

## Installation

### Prerequisites

- Node.js 22+
- pnpm 11+

### Clone and install

```bash
git clone https://github.com/Doubleshotjs/doubleshot.git
cd doubleshot
pnpm install
```

## Usage

### Start developing

```bash
pnpm install
pnpm test-only
```

### Build the monorepo

```bash
pnpm build
```

### Run the full test pipeline

```bash
pnpm test
```

### Lint and auto-fix

```bash
pnpm lint
pnpm lint:fix
```

### Publish or release

```bash
pnpm release
pnpm ci-publish
```

## Development workflow

1. Install dependencies with `pnpm install`.
2. Develop or adjust the relevant package under `packages/`.
3. Run tests with `pnpm test-only` while iterating.
4. Build the workspace with `pnpm build`.
5. Prepare releases with the release scripts when changes are ready.

## When to use it

Doubleshot is a good fit if you want to:

- Build an Electron app without abandoning backend structure and patterns
- Reuse more logic between desktop and future web deployments
- Keep NestJS and Electron integration in one maintainable workspace
- Start from a toolkit instead of wiring every process manually

## Project status

> **Warning**: the project is still in an early stage and is not recommended for production use yet.

That makes documentation especially important, because early adopters need a fast path to understanding the package layout and commands.

## License

MIT License © 2022 [Archer Gu](https://github.com/archergu)
