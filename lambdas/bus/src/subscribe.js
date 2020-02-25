import {
  REGION,
  RESOURCE_ARN,
  SECRET_ARN,
  DATABASE_NAME,
  SUBSCRIBERS_TABLE_NAME
} from './constants'

import { escapeId, escapeStr, executeStatement } from './postgres'
import uuid from 'uuid/v4'
import * as changesets from 'diff-json'

export async function subscribe(subscriptionDescription) {
  const {
    eventSubscriber,
    credentials,
    queueStrategy,
    deliveryStrategy,
    endpoint,
    eventTypes,
    aggregateIds,
    maxParallel
  } = subscriptionDescription
  // TODO validation
  const postgresUser = {
    region: REGION,
    resourceArn: RESOURCE_ARN,
    secretArn: SECRET_ARN
  }

  const subscriptionId = uuid()

  const rows = await executeStatement(
    postgresUser,
    `WITH "prev_event_subscriber" AS (
      SELECT * FROM ${escapeId(DATABASE_NAME)}.${escapeId(SUBSCRIBERS_TABLE_NAME)}
      WHERE "eventSubscriber" = ${escapeStr(eventSubscriber)}
    ), "next_event_subscriber" AS (
      INSERT INTO ${escapeId(DATABASE_NAME)}.${escapeId(SUBSCRIBERS_TABLE_NAME)}(
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
        ${escapeStr(JSON.stringify(credentials))},
        ${escapeStr(queueStrategy)},
        ${escapeStr(deliveryStrategy)},
        ${escapeStr(endpoint)},
        ${escapeStr(JSON.stringify(eventTypes))},
        ${escapeStr(JSON.stringify(aggregateIds))},
        ${+maxParallel}
      ) ON CONFLICT ("eventSubscriber")
      DO UPDATE SET
        "credentials" = ${escapeStr(JSON.stringify(credentials))},
        "queueStrategy" = ${escapeStr(queueStrategy)},
        "deliveryStrategy" = ${escapeStr(deliveryStrategy)},
        "endpoint" = ${escapeStr(endpoint)},
        "eventTypes" = ${escapeStr(JSON.stringify(eventTypes))},
        "aggregateIds" = ${escapeStr(JSON.stringify(aggregateIds))},
        "maxParallel" = ${+maxParallel}
      RETURNING "subscriptionId"
    )
    SELECT "credentials",
        "queueStrategy",
        "deliveryStrategy",
        "endpoint",
        "eventTypes",
        "aggregateIds",
        "maxParallel"
    FROM "prev_event_subscriber"
    WHERE (
      SELECT Count(*) FROM "next_event_subscriber"
    ) < 2
   `
  )

  const diff = changesets.diff(rows.length > 0 ? rows[0] : {}, subscriptionDescription)

  return { subscriptionId, diff }
}
