# apollo-vue-devtool: Integrate Apollo with Vue Devtools

<p align="center">
    <a href="https://codeclimate.com/github/storipress/apollo-vue-devtools/maintainability"><img src="https://api.codeclimate.com/v1/badges/2fbe8efb091e0ae30c69/maintainability" /></a>
    <a href="https://codeclimate.com/github/storipress/apollo-vue-devtools/test_coverage"><img src="https://api.codeclimate.com/v1/badges/2fbe8efb091e0ae30c69/test_coverage" /></a>
 </p>


![](./example/src/assets/timeline.png)

## Usage

1. Add the plugin to your Vue project:
```js
import { createApp } from 'vue'
import Plugin from '@storipress/apollo-vue-devtool'
import App from './App.vue'

const app = createApp(App)
app.use(Plugin)
app.mount('#app')
```

2. Add the DebugLink to your Apollo client:

```js
import { DebugLink } from '@storipress/apollo-vue-devtool'
import { ApolloClient, ApolloLink, HttpLink } from '@apollo/client/client'

const client = new ApolloClient({
  link: ApolloLink.from([
    new DebugLink(),
    new HttpLink({
      uri: 'http://example.com/graphql',
    }),
  ]),
})
```

3. Now open Vue Devtools and you'll see your queries in the timeline!

## Installation

### NPM

```shell
$ npm install --save-dev @storipress/apollo-vue-devtool
```

### Yarn

```shell
$ yarn add --dev @storipress/apollo-vue-devtool
```
