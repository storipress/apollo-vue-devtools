import { setupDevtoolsPlugin, DevtoolsPluginApi } from '@vue/devtools-api'
import { print } from 'graphql'
import { Operation, FetchResult, DocumentNode, Observer } from '@apollo/client/core'
import { getMainDefinition } from '@apollo/client/utilities'
import { App } from 'vue'

const timelineLayerId = 'apollo-vue-devtool'

const noop = () => {}

let devtoolsApi: Pick<DevtoolsPluginApi<{}>, 'addTimelineEvent'> = {
  addTimelineEvent: noop,
}

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
      data: { ...operation, query: print(operation.query) },
      title,
      subtitle: 'start',
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
          title,
          subtitle: 'response',
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
          title,
          subtitle: 'error',
          logType: 'error',
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
          title,
          subtitle: 'done',
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
