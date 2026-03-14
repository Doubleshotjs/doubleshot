import type { Plugin, ViteDevServer } from 'vite'
import { EventEmitter } from 'node:events'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { VitePluginDoubleshot } from '../src'

const { buildMock, devMock, defineConfigMock } = vi.hoisted(() => {
  return {
    buildMock: vi.fn(),
    devMock: vi.fn(async () => { }),
    defineConfigMock: vi.fn(),
  }
})

vi.mock('@doubleshot/builder', () => ({
  build: buildMock,
  dev: devMock,
  defineConfig: defineConfigMock,
}))

interface ServerOptions {
  base?: string
  host?: string | boolean
  https?: boolean
  address: { address: string, family: string, port: number } | string | null
  resolvedLocalUrl?: string
  resolvedNetworkUrl?: string
}

function createServer(options: ServerOptions): ViteDevServer {
  const {
    address,
    base = '/',
    host = true,
    https = false,
    resolvedLocalUrl,
    resolvedNetworkUrl,
  } = options

  const httpServer = new EventEmitter() as EventEmitter & {
    address: () => ServerOptions['address']
  }
  httpServer.address = () => address

  return {
    httpServer,
    config: {
      base,
      server: {
        host,
        https,
      },
    },
    resolvedUrls: {
      local: resolvedLocalUrl ? [resolvedLocalUrl] : [],
      network: resolvedNetworkUrl ? [resolvedNetworkUrl] : [],
    },
  } as unknown as ViteDevServer
}

function getServePlugin() {
  const plugins = VitePluginDoubleshot({})
  const servePlugin = plugins[0] as Plugin
  return servePlugin
}

function invokeConfigureServer(plugin: Plugin, server: ViteDevServer) {
  const configureServer = plugin.configureServer
  if (!configureServer)
    return

  if (typeof configureServer === 'function') {
    ;(configureServer as (server: ViteDevServer) => void)(server)
    return
  }

  ;(configureServer.handler as (server: ViteDevServer) => void)(server)
}

describe('vitePluginDoubleshot URL resolve', () => {
  beforeEach(() => {
    devMock.mockClear()
  })

  it('should resolve 0.0.0.0 to localhost', async () => {
    const servePlugin = getServePlugin()
    const server = createServer({
      address: { address: '0.0.0.0', family: 'IPv4', port: 5173 },
      base: '/',
      host: true,
      https: false,
    })

    invokeConfigureServer(servePlugin, server)
    server.httpServer?.emit('listening')

    await vi.waitFor(() => {
      expect(devMock).toHaveBeenCalledTimes(1)
    })
    expect(devMock).toHaveBeenLastCalledWith(expect.objectContaining({
      rendererUrl: 'http://localhost:5173/',
    }))
  })

  it('should normalize IPv6 host format', async () => {
    const servePlugin = getServePlugin()
    const server = createServer({
      address: { address: '::1', family: 'IPv6', port: 5173 },
      base: '/app/',
      host: true,
      https: true,
    })

    invokeConfigureServer(servePlugin, server)
    server.httpServer?.emit('listening')

    await vi.waitFor(() => {
      expect(devMock).toHaveBeenCalledTimes(1)
    })
    expect(devMock).toHaveBeenLastCalledWith(expect.objectContaining({
      rendererUrl: 'https://[::1]:5173/app/',
    }))
  })

  it('should fallback to resolvedUrls when address is unavailable', async () => {
    const servePlugin = getServePlugin()
    const server = createServer({
      address: null,
      resolvedLocalUrl: 'http://localhost:5173/',
    })

    invokeConfigureServer(servePlugin, server)
    server.httpServer?.emit('listening')

    await vi.waitFor(() => {
      expect(devMock).toHaveBeenCalledTimes(1)
    })
    expect(devMock).toHaveBeenLastCalledWith(expect.objectContaining({
      rendererUrl: 'http://localhost:5173/',
    }))
  })
})
