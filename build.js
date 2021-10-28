;(async () => {
  const esbuild = require('esbuild')
  esbuild.build({
    entryPoints: ['./src'],
    platform: 'node',
    bundle: false,
    outfile: 'dist.js'
  })
})()
