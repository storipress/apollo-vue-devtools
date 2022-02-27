import { setupDevtoolsPlugin, DevtoolsPluginApi } from '@vue/devtools-api'
import { Operation, FetchResult, DocumentNode } from '@apollo/client/core'
import { getMainDefinition } from '@apollo/client/utilities'
import { Observer } from 'zen-observable-ts'
import { App } from 'vue'

const timelineLayerId = 'apollo-vue-devtool'

let devtoolsApi: DevtoolsPluginApi<{}>

const noop = () => {}

export const devtools = {
  trackStart: (operation: Operation): Required<Omit<Observer<FetchResult>, 'start'>> => {
    if (process.env.NODE_ENV == 'development' || __VUE_PROD_DEVTOOLS__) {
      return createTrackObserver(operation)
    }

    return {
      next: noop,
      error: noop,
      complete: noop,
    }
  },
}

let trackId = 0

function createTrackObserver(operation: Operation): Required<Omit<Observer<FetchResult>, 'start'>> {
  const groupId = 'request' + trackId++
  const queryType = getQueryType(operation.query)
  const title = operation.operationName ? `${queryType} ${operation.operationName}` : queryType

  devtoolsApi.addTimelineEvent({
    layerId: timelineLayerId,
    event: {
      time: Date.now(),
      data: operation,
      title,
      groupId,
    },
  })

  return {
    next: (data) => {
      devtoolsApi.addTimelineEvent({
        layerId: timelineLayerId,
        event: {
          time: Date.now(),
          data,
          title: `${title} (response)`,
          groupId,
        },
      })
    },
    error: (error) => {
      devtoolsApi.addTimelineEvent({
        layerId: timelineLayerId,
        event: {
          time: Date.now(),
          data: { error },
          title: `${title} (error)`,
          groupId,
        },
      })
    },
    complete: () => {
      devtoolsApi.addTimelineEvent({
        layerId: timelineLayerId,
        event: {
          time: Date.now(),
          data: {},
          title: `${title} (done)`,
          groupId,
        },
      })
    },
  }
}

function getQueryType(document: DocumentNode): string {
  const definition = getMainDefinition(document)
  if (definition.kind === 'OperationDefinition') {
    return definition.operation
  }
  return 'query'
}

const id = '@storipress/apollo-vue-devtool'

export function setupDevtools(app: App) {
  setupDevtoolsPlugin(
    {
      id,
      label: 'Apollo',
      packageName: id,
      homepage: 'https://github.com/Storipress/apollo-vue-devtool',
      enableEarlyProxy: true,
      app: app as any,
    },
    (api) => {
      devtoolsApi = api

      api.addTimelineLayer({
        id: timelineLayerId,
        color: 0xff984f,
        label: 'Apollo',
      })
    }
  )

  return devtools
}
