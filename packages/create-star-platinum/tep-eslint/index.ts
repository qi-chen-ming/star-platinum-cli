const vue = {
  env: {
    browser: true,
    es2021: true,
    node: true
  },
  extends: ['eslint:recommended', 'plugin:vue/vue3-essential'],
  overrides: [],
  parserOptions: {
    ecmaVersion: 6,
    sourceType: 'module'
  },
  plugins: ['vue'],
  rules: {}
}
const vue_ts = {
  env: {
    browser: true,
    es2021: true,
    node: true
  },
  extends: ['plugin:vue/vue3-essential', 'standard-with-typescript'],
  overrides: [],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: ['./tsconfig.json']
  },
  plugins: ['vue'],
  rules: {}
}
const react = {
  env: {
    browser: true,
    es2021: true,
    node: true
  },
  extends: ['plugin:react/recommended', 'standard'],
  overrides: [],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  plugins: ['react'],
  rules: {}
}
const react_ts = {
  env: {
    browser: true,
    es2021: true,
    node: true
  },
  extends: ['plugin:react/recommended', 'standard-with-typescript'],
  overrides: [],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: ['./tsconfig.json']
  },
  plugins: ['react'],
  rules: {}
}

// "indent": [
//   "error",
//   2
// ],
// "linebreak-style": [
//   "error",
//   "windows"
// ],
// "quotes": [
//   "error",
//   "double"
// ],
// "semi": [
//   "error",
//   "always"
// ]
const lintFilesArr: any = {
  vue: ['./src/**/*.js', './src/*.js', './src/**/*.vue'],
  vue_ts: ['./src/**/*.ts', './src/*.ts', './src/**/*.vue'],
  react: ['./src/**/*.jsx', './src/*.jsx', './src/**/*.ts', './src/*.ts'],
  react_ts: ['./src/**/*.tsx', './src/*.tsx', './src/**/*.ts', './src/*.ts']
}
export { vue, vue_ts, react, react_ts, lintFilesArr }
