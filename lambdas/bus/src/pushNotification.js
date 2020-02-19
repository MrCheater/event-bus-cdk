import { LONG_INTEGER_SQL_TYPE, JSON_SQL_TYPE, REGION, RESOURCE_ARN, SECRET_ARN,
  DATABASE_NAME, SUBSCRIBERS_TABLE_NAME, NOTIFICATIONS_TABLE_NAME
 } from './constants'
import { selfInvoke } from './selfInvoke'
import { escapeId, escapeStr, executeStatement } from './postgres'


export async function pushNotification(event) {
  const postgresUser = {
    region: REGION,
    resourceArn: RESOURCE_ARN,
    secretArn: SECRET_ARN
  }

  const rows = await executeStatement(
    postgresUser,
    `WITH "subscriptionIds" AS (
      SELECT "S"."subscriptionId"
      FROM ${escapeId(DATABASE_NAME)}.${escapeId(SUBSCRIBERS_TABLE_NAME)} "S"
      WHERE (
        "S"."eventTypes" -> ${escapeStr(event.type)} = 'true'::${JSON_SQL_TYPE} OR
        "S"."eventTypes" = 'null'::${JSON_SQL_TYPE}
      ) AND ( 
        "S"."aggregateIds" -> ${escapeStr(event.aggregateId)} = 'true'::${JSON_SQL_TYPE} OR
        "S"."aggregateIds" = 'null'::${JSON_SQL_TYPE}
      )
    ), "insertingClause" AS ( 
      INSERT INTO ${escapeId(DATABASE_NAME)}.${escapeId(NOTIFICATIONS_TABLE_NAME)}(
        "subscriptionId",
        "incomingTimestamp",
        "processStartTimestamp",
        "processEndTimestamp",
        "heartbeatTimestamp",
        "aggregateIdAndVersion"    
      ) SELECT 
        "subscriptionIds"."subscriptionId" AS "subscriptionId",
        CAST(extract(epoch from clock_timestamp()) * 1000 AS ${LONG_INTEGER_SQL_TYPE}) AS "incomingTimestamp",
        NULL AS "processStartTimestamp",
        NULL AS "processEndTimestamp",
        NULL AS "heartbeatTimestamp",
        ${escapeStr(`${event.aggregateId}:${event.aggregateVersion}`)} AS "aggregateIdAndVersion"
      FROM "subscriptionIds"
    )
    SELECT "subscriptionIds"."subscriptionId" AS "subscriptionId"
    FROM "subscriptionIds"
  `
  )
  const applicationPromises = []

  for (const { subscriptionId } of rows) {
    applicationPromises.push(selfInvoke({
      type: 'pull',
      payload: { subscriptionId }
    }))
  }

  await Promise.all(applicationPromises)
}
