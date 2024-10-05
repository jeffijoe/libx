import typescript from '@rollup/plugin-typescript'
import typescriptCompiler from 'typescript'
import tsconfig from './tsconfig.json' with { type: 'json' }

const tsOpts = {
  typescript: typescriptCompiler,
  compilerOptions: {
    ...tsconfig.compilerOptions,
    module: 'ESNext',
  },
}

/**
 * @type {import('rollup').RollupOptions[]}
 */
export default [
  // ES modules
  {
    input: 'src/index.ts',
    external: ['mobx'],
    treeshake: { moduleSideEffects: 'no-external' },
    output: [
      {
        file: 'lib/index.mjs',
        sourcemap: true,
        format: 'es',
      },
    ],
    plugins: [typescript(tsOpts)],
  },
]
