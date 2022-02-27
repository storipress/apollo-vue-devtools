import './style.css'

import { createApp } from 'vue'
import App from './App.vue'
import ApolloDevtool, { DebugLink } from '@storipress/apollo-vue-devtool'
import { ApolloClient, InMemoryCache, HttpLink, ApolloLink } from '@apollo/client/core'
import { DefaultApolloClient } from '@vue/apollo-composable'

const client = new ApolloClient({
  cache: new InMemoryCache(),
  link: ApolloLink.from([
    new DebugLink(),
    new HttpLink({
      uri: 'https://graphql-demo.mead.io',
    }),
  ]),
})

createApp(App).use(ApolloDevtool).provide(DefaultApolloClient, client).mount('#app')
