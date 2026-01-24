import * as esbuild from 'esbuild';
import { glob } from 'glob';

const entryPoints = await glob('src/server.ts', {
  ignore: ['**/*.test.ts', '**/*.spec.ts']
});

await esbuild.build({
  entryPoints,
  outfile: './dist/main.js',
  platform: 'node',
  target: 'es2022',
  format: 'esm',
  bundle: true,
  minify: true
});

console.log('✅ Build completed!');
