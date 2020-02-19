import uuid from 'uuid/v4'

import { LONG_INTEGER_SQL_TYPE, JSON_SQL_TYPE, REGION, RESOURCE_ARN, SECRET_ARN,
  DATABASE_NAME, SUBSCRIBERS_TABLE_NAME, NOTIFICATIONS_TABLE_NAME
} from './constants'

import { escapeId, escapeStr, executeStatement } from './postgres'

const pullNotifications = async ({ subscriptionId }) => {
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
        SELECT * FROM ${escapeId(DATABASE_NAME)}.${escapeId(NOTIFICATIONS_TABLE_NAME)}
        WHERE "subscriptionId" = ${escapeStr(subscriptionId)}
        FOR UPDATE NOWAIT
      ), "seized_rows" AS (
        SELECT * FROM "lock_rows"
        WHERE "lock_rows"."subscriptionId" = ${escapeStr(subscriptionId)}
        AND "lock_rows"."processStartTimestamp" IS NOT NULL
      ), "updated_rows" AS (
        UPDATE ${escapeId(DATABASE_NAME)}.${escapeId(NOTIFICATIONS_TABLE_NAME)}
        SET "processStartTimestamp" = CAST(extract(epoch from clock_timestamp()) * 1000 AS ${LONG_INTEGER_SQL_TYPE}),
        "heartbeatTimestamp" = CAST(extract(epoch from clock_timestamp()) * 1000 AS ${LONG_INTEGER_SQL_TYPE}),
        "batchId" = ${escapeStr(batchId)}
        WHERE "subscriptionId" = ${escapeStr(subscriptionId)}
        AND (SELECT Count(*) FROM "seized_rows") = 0
        RETURNING *
      )
      SELECT * FROM ${escapeId(DATABASE_NAME)}.${escapeId(SUBSCRIBERS_TABLE_NAME)}
      LEFT JOIN "updated_rows"
      ON ${escapeId(DATABASE_NAME)}.${escapeId(SUBSCRIBERS_TABLE_NAME)}."subscriptionId" = 
      "updated_rows"."subscriptionId"
      `
    )
  } catch (error) {
    if (!/could not obtain lock/.test(error.message)) {
      throw error
    }
  }

  if (rows.length === 0) {
    throw new Error('Empty tasks error')
  }

  console.log(JSON.stringify(rows, null, 2))
}

export { pullNotifications }
