export const isElectron = Object.hasOwn(process.versions, 'electron')

export function linkPathAndChannel(channel: string, path = '') {
  const merged = [...path.split('/'), ...channel.split('/')].filter(s => !!s.length).join('/')

  return [
    `/${merged}`,
    `${merged}/`,
    `/${merged}/`,
    merged,
  ]
}

export function generateRandomString() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}
