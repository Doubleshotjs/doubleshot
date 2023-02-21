export function linkPathAndChannel(channel: string, path = '') {
  path = path.charAt(0) === '/' ? path.slice(1) : path
  path = path.charAt(path.length - 1) === '/' ? path.slice(0, -1) : path
  channel = channel.charAt(0) === '/' ? channel.slice(1) : channel
  channel = channel.charAt(channel.length - 1) === '/' ? channel.slice(0, -1) : channel

  channel = path.length > 0 ? `${path}/${channel}` : channel

  return [
    `/${channel}`,
    `${channel}/`,
    `/${channel}/`,
    channel,
  ]
}

export function generateRandomString() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}
