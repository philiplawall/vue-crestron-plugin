import path from 'path'
import { defineConfig } from 'vite'
import typescript from '@rollup/plugin-typescript'
import { typescriptPaths } from 'rollup-plugin-typescript-paths'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      formats: ['es']
    },
    minify: false,
    cssMinify: false,
    rollupOptions: {
      external: [],
      plugins: [
        typescript({
          sourceMap: false,
          declaration: true,
          outDir: 'dist/@types'
        }),
        typescriptPaths({
          preserveExtensions: true
        })
      ]
    },
    watch: {
      include: ['src/**/*']
    }
  }
})
