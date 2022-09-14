import { defineConfig } from 'mono-release'

export default defineConfig({
  relationships: [
    {
      pkgs: ['plugin-vite'],
      base: 'builder',
    },
  ],
  commitMessagePlaceholder: 'skip-ci',
})
