import { pushNotification } from './pushNotification'
import { pullNotifications } from './pullNotifications'
import { create, drop } from './lifecycle'
import { updateEnvs } from './constants'

const handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false
  updateEnvs(context)

  switch (event.type) {
    case 'create': {
      return create()
    }
    case 'drop': {
      return drop()
    }
    case 'push': {
      return pushNotification(event.payload)
    }
    case 'pull': {
      return pullNotifications(event.payload)
    }
    case 'heartbeatBatch': {
    }
    case 'successBatch': {
    }
    case 'failureBatch': {
    }
    default: {
      throw new Error(`Unknown event.type = ${event.type}`)
    }
  }
}

export default handler
