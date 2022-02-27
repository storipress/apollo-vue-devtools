import { App } from 'vue'
import { setupDevtools } from './devtools'

export { DebugLink } from './debug-link'

export default {
  install(app: App) {
    if (process.env.NODE_ENV === 'development' || __VUE_PROD_DEVTOOLS__) {
      setupDevtools(app)
    }
  },
}
