import { LONG_INTEGER_SQL_TYPE, JSON_SQL_TYPE, REGION, RESOURCE_ARN, SECRET_ARN } from './constants'

const invokeFunction = async subscriptionId => {
  console.log(subscriptionId)
}

export async function pushNotification(pool, event) {
  const {
    executeStatement,
    escapeId,
    escapeStr,
    databaseName,
    subscribersTableName,
    notificationsTableName
  } = pool

  const postgresUser = {
    region: REGION,
    resourceArn: RESOURCE_ARN,
    secretArn: SECRET_ARN
  }

  const rows = await executeStatement(
    postgresUser,
    `WITH "subscriptionIds" AS (
      SELECT "S"."subscriptionId"
      FROM ${escapeId(databaseName)}.${escapeId(subscribersTableName)} "S"
      WHERE (
        "S"."eventTypes" -> ${escapeStr(event.type)} = 'true'::${JSON_SQL_TYPE} OR
        "S"."eventTypes" = 'null'::${JSON_SQL_TYPE}
      ) AND ( 
        "S"."aggregateIds" -> ${escapeStr(event.aggregateId)} = 'true'::${JSON_SQL_TYPE} OR
        "S"."aggregateIds" = 'null'::${JSON_SQL_TYPE}
    ), "insertingClause" AS ( 
      INSERT INTO ${escapeId(databaseName)}.${escapeId(notificationsTableName)}(
        "subscriptionId",
        "incomingTimestamp",
        "processStartTimestamp",
        "processEndTimestamp",
        "heartbeatTimestamp",
        "aggregateIdAndVersion",    
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
    applicationPromises.push(invokeFunction(subscriptionId))
  }

  await Promise.all(applicationPromises)
}
