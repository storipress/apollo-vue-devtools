import { ApolloLink, FetchResult, NextLink, Operation } from '@apollo/client/core'
import { devtools } from './devtools'
import { Observable } from 'zen-observable-ts'

export class DebugLink extends ApolloLink {
  override request(operation: Operation, forward: NextLink): Observable<FetchResult> {
    const subscriber = devtools.trackStart(operation)

    return new Observable((observer) => {
      const handle = forward(operation).subscribe({
        next: (data) => {
          subscriber.next(data)
          observer.next(data)
        },
        error: (error) => {
          subscriber.error(error)
          observer.error(error)
        },
        complete: () => {
          subscriber.complete()
          observer.complete()
        },
      })

      return () => {
        handle.unsubscribe()
      }
    })
  }
}
