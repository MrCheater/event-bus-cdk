import { pushNotification } from './pushNotification'
import { pullNotifications } from './pullNotifications'
import { create, drop } from './database'
import { createPool } from './createPool'

const handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false
  const pool = createPool(context)

  switch (event.type) {
    case 'create': {
      return create(pool)
    }
    case 'drop': {
      return drop(pool)
    }
    case 'push': {
      return pushNotification(pool, event.payload)
    }
    case 'pull': {
      const { subscriptionId } = event.payload
      return pullNotifications(pool, subscriptionId)
    }
    case 'heartbeatBatch': {
    }
    case 'successBatch': {
    }
    case 'failureBatch': {
    }
  }
  return 'Hello world!'
}

export default handler
