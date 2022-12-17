  // eslint-disable-next-line @typescript-eslint/no-var-requires
const esbuild = require('esbuild')

esbuild.build({
  bundle: true,
  entryPoints: ['src/extension.ts'],
  external: ['vscode', 'canvas', './xhr-sync-worker.js'],
  minify: true,
  outfile: './out/extension.js',
  platform: 'node',
})
