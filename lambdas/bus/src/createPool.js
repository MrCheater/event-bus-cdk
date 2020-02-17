import { executeStatement, escapeStr, escapeId } from './postgres'

import {
  DATABASE_NAME,
  REGION,
  RESOURCE_ARN,
  SECRET_ARN,
  BUS_LOGIN,
  NOTIFICATIONS_TABLE_NAME,
  SUBSCRIBERS_TABLE_NAME
} from './constants'

export function createPool(lambdaContext) {
  const pool = {
    region: REGION,
    resourceArn: RESOURCE_ARN,
    secretArn: SECRET_ARN,
    databaseName: DATABASE_NAME,
    busLogin: BUS_LOGIN,
    notificationsTableName: NOTIFICATIONS_TABLE_NAME,
    subscribersTableName: SUBSCRIBERS_TABLE_NAME,
    selfFunctionName: lambdaContext.functionName,
    escapeId,
    escapeStr
  }

  pool.executeStatement = executeStatement.bind(null, pool)

  return pool
}
