<script setup>
import { useLazyQuery, useResult } from '@vue/apollo-composable'
import { gql } from '@apollo/client/core'
const { result, load } = useLazyQuery(gql`
  query GetMe {
    me {
      id
      name
      email
    }
  }
`)
const me = useResult(result)
</script>

<template>
  <div class="m-2">
    <div class="text-xl font-bold">Please open vue devtool and see in the Timeline tab</div>
    <div class="flex items-center gap-2 my-2">
      <button class="p-2 bg-teal-600 text-white" @click="load()">Send request</button>
      <div>result: {{ me || 'undefined' }}</div>
    </div>
    <img src="./assets/timeline.png" />
  </div>
</template>
