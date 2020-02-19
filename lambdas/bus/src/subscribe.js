import { LONG_INTEGER_SQL_TYPE, JSON_SQL_TYPE, REGION, RESOURCE_ARN, SECRET_ARN,
  DATABASE_NAME, SUBSCRIBERS_TABLE_NAME, NOTIFICATIONS_TABLE_NAME
} from './constants'

import { escapeId, escapeStr, executeStatement } from './postgres'
import uuid from 'uuid/v4'

const subscribe = async ({ eventSubscriber }) => {
  const postgresUser = {
    region: REGION,
    resourceArn: RESOURCE_ARN,
    secretArn: SECRET_ARN
  }

  const subscriptionId = uuid()

  await executeStatement(
    postgresUser,
    `INSERT INTO ${escapeId(DATABASE_NAME)}.${escapeId(SUBSCRIBERS_TABLE_NAME)}(
      "subscriptionId",
      "eventSubscriber",
      "credentials",
      "queueStrategy",
      "deliveryStrategy",
      "endpoint",
      "eventTypes",
      "aggregateIds",
      "maxParallel"
    ) VALUES (
      ${escapeStr(subscriptionId)},
      ${escapeStr(eventSubscriber)},
      'credentials',
      'queueStrategy',
      'deliveryStrategy',
      'endpoint',
      CAST('null' AS JSON),
      CAST('null' AS JSON),
      100
    )
    `
  )

  return subscriptionId
}

export { subscribe }
