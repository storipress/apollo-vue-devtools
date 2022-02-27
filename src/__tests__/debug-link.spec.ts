import './mock-devtools'

import { ApolloClient, InMemoryCache, ApolloLink, HttpLink, gql } from '@apollo/client/core'
import { vi, test, expect, afterEach, beforeAll, afterAll } from 'vitest'
import { setupServer } from 'msw/node'
import { graphql } from 'msw'
import { DebugLink } from '../debug-link'
import { observer, trackStart } from './mock-devtools'
import fetch from 'cross-fetch'

const handlers = [
  graphql.query('Foo', (req, res, ctx) => {
    return res(
      ctx.data({
        foo: 'bar',
      })
    )
  }),
]

const server = setupServer(...handlers)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterAll(() => server.close())

afterEach(() => {
  server.resetHandlers()
  vi.resetAllMocks()
})

test('track subscriber should be called', async () => {
  const client = createClient()
  const promise = client.query({
    query: gql`
      query Foo {
        foo
      }
    `,
    fetchPolicy: 'network-only',
  })

  expect(trackStart).toHaveBeenCalledTimes(1)
  expect(observer.next).not.toHaveBeenCalled()

  await promise

  expect(observer.next).toHaveBeenCalledTimes(1)
  expect(vi.mocked(observer.next).mock.calls[0]).toMatchInlineSnapshot(`
    [
      {
        "data": {
          "foo": "bar",
        },
      },
    ]
  `)
  expect(observer.complete).toHaveBeenCalled()
})

function createClient() {
  return new ApolloClient({
    cache: new InMemoryCache(),
    link: ApolloLink.from([
      new DebugLink(),
      new HttpLink({
        uri: 'http://localhost:4000',
        fetch,
      }),
    ]),
  })
}
