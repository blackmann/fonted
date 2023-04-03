import esbuild from 'esbuild';

esbuild.build({
  bundle: true,
  entryPoints: ['src/extension.ts'],
  external: ['vscode'],
  minify: true,
  outfile: './out/extension.js',
  platform: 'node',
})
