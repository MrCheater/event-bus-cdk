import uuid from 'uuid/v4'

import { REGION, RESOURCE_ARN, SECRET_ARN } from './constants'

const pullNotifications = async (pool, subscriptionId) => {
  const {
    executeStatement,
    escapeId,
    escapeStr,
    databaseName,
    subscribersTableName,
    notificationsTableName
  } = pool
  const batchId = uuid()
  let rows = []

  const postgresUser = {
    region: REGION,
    resourceArn: RESOURCE_ARN,
    secretArn: SECRET_ARN
  }

  try {
    rows = await executeStatement(
      postgresUser,
      `WITH "lock_rows" AS (
        SELECT * FROM ${escapeId(databaseName)}.${escapeId(notificationsTableName)}
        WHERE "subscriptionId" = ${escapeStr(subscriptionId)}
        FOR UPDATE NOWAIT
      ), "seized_rows" AS (
        SELECT * FROM "lock_rows"
        WHERE "lock_rows"."subscriptionId" = ${escapeStr(subscriptionId)}
        AND "lock_rows"."processStartTimestamp" IS NOT NULL
      ), "updated_rows" AS (
        UPDATE ${escapeId(databaseName)}.${escapeId(notificationsTableName)}
        SET "processStartTimestamp" = CAST(extract(epoch from clock_timestamp()) * 1000,
        "heartbeatTimestamp" = CAST(extract(epoch from clock_timestamp()) * 1000,
        "batchId" = ${escapeStr(batchId)}
        WHERE "subscriptionId" = ${escapeStr(subscriptionId)}
        AND Count("seized_rows".*) = 0
        RETURNING *
      )
      SELECT * FROM ${escapeId(databaseName)}.${escapeId(subscribersTableName)}
      LEFT JOIN "updated_rows"
      ON ${escapeId(databaseName)}.${escapeId(subscribersTableName)}."subscriptionId" = 
      "updated_rows"."subscriptionId"
      `
    )
  } catch (error) {
    if (!/kube_error/.test(error.message)) {
      throw error
    }
  }

  if (rows.length === 0) {
    throw new Error('Kube error')
  }

  console.log(JSON.stringify(rows, null, 2))
}

export { pullNotifications }
