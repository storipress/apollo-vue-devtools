import vuePlugin from 'rollup-plugin-vue'
import ts from 'rollup-plugin-ts'
import replace from '@rollup/plugin-replace'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import pascalcase from 'pascalcase'
import { readFile } from 'node:fs/promises'
import typescript from 'typescript'

const pkg = JSON.parse(await readFile('./package.json', 'utf-8'))
const name = pkg.name.replace('@storipress/', '')

const banner = `/*!
  * ${pkg.name} v${pkg.version}
  * Storipress (c) ${new Date().getFullYear()} Storipress Developers
  * @license MIT
  */`

// ensure TS checks only once for each build
let hasTSChecked = false

const outputConfigs = {
  // each file name has the format: `dist/${name}.${format}.js`
  // format being a key of this object
  'esm-bundler': {
    file: pkg.module,
    format: `es`,
  },
  cjs: {
    file: pkg.main,
    format: `cjs`,
  },
  // global: {
  //   file: pkg.unpkg,
  //   format: `iife`,
  // },
  esm: {
    file: pkg.module.replace('bundler', 'browser'),
    format: `es`,
  },
}

const allFormats = Object.keys(outputConfigs)
const packageFormats = allFormats
const packageConfigs = packageFormats.map((format) => createConfig(format, outputConfigs[format]))

// only add the production ready if we are bundling the options
packageFormats.forEach((format) => {
  if (format === 'cjs') {
    packageConfigs.push(createProductionConfig(format))
  } else if (format === 'global') {
    packageConfigs.push(createMinifiedConfig(format))
  }
})

export default packageConfigs

function createConfig(format, output, plugins = []) {
  if (!output) {
    console.log(`invalid format: "${format}"`)
    process.exit(1)
  }

  output.sourcemap = !!process.env.SOURCE_MAP
  output.banner = banner
  output.externalLiveBindings = false
  output.globals = { vue: 'Vue', '@vue/composition-api': 'vueCompositionApi' }
  output.exports = 'named'

  const isProductionBuild = /\.prod\.js$/.test(output.file)
  const isGlobalBuild = format === 'global'
  const isRawESMBuild = format === 'esm'
  const isNodeBuild = format === 'cjs'
  const isBundlerESMBuild = /esm-bundler/.test(format)

  if (isGlobalBuild) output.name = pascalcase(pkg.name)

  const shouldEmitDeclarations = !hasTSChecked

  const tsPlugin = ts({
    check: !hasTSChecked,
    typescript,
    tsconfig: (resolvedConfig) => ({
      ...resolvedConfig,
      sourceMap: output.sourcemap,
      declaration: shouldEmitDeclarations,
      declarationMap: shouldEmitDeclarations,
    }),
  })
  // we only need to check TS and generate declarations once for each build.
  // it also seems to run into weird issues when checking multiple times
  // during a single build.
  hasTSChecked = true

  const external = ['vue', '@vue/composition-api', '@apollo/client/core', '@apollo/client/utilities', 'graphql']
  if (!isGlobalBuild) {
    external.push('@vue/devtools-api')
  }

  const nodePlugins = [resolve(), commonjs()]

  return {
    input: `src/index.ts`,
    // Global and Browser ESM builds inlines everything so that they can be
    // used alone.
    external,
    plugins: [
      vuePlugin(),
      tsPlugin,
      createReplacePlugin(isProductionBuild, isBundlerESMBuild),
      ...nodePlugins,
      ...plugins,
    ],
    output,
  }
}

function createReplacePlugin(isProduction, isBundlerESMBuild) {
  const replacements = {
    'process.env.NODE_ENV': isBundlerESMBuild
      ? // preserve to be handled by bundlers
        `process.env.NODE_ENV`
      : // hard coded dev/prod builds
        JSON.stringify(isProduction ? 'production' : 'development'),
    __VUE_PROD_DEVTOOLS__: isBundlerESMBuild ? `__VUE_PROD_DEVTOOLS__` : 'false',
  }
  // allow inline overrides like
  //__RUNTIME_COMPILE__=true yarn build
  Object.keys(replacements).forEach((key) => {
    if (key in process.env) {
      replacements[key] = process.env[key]
    }
  })
  return replace({
    preventAssignment: true,
    values: replacements,
  })
}

function createProductionConfig(format) {
  return createConfig(format, {
    file: `dist/${name}.${format}.prod.js`,
    format: outputConfigs[format].format,
  })
}

function createMinifiedConfig(format) {
  const { terser } = require('rollup-plugin-terser')
  return createConfig(
    format,
    {
      file: `dist/${name}.${format}.prod.js`,
      format: outputConfigs[format].format,
    },
    [
      terser({
        module: /^esm/.test(format),
        compress: {
          ecma: 2015,
          pure_getters: true,
        },
      }),
    ]
  )
}
