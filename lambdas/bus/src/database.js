import {
  JSON_SQL_TYPE,
  LONG_INTEGER_SQL_TYPE,
  SERIAL_SQL_TYPE,
  STRING_SQL_TYPE,
  TEXT_SQL_TYPE
} from './constants'

export async function create({
  executeStatement,
  escapeId,
  databaseName,
  busLogin,
  notificationsTableName,
  subscribersTableName
}) {
  await executeStatement(
      `CREATE SCHEMA IF NOT EXISTS ${escapeId(databaseName)};
      CREATE TABLE IF NOT EXISTS ${escapeId(databaseName)}.${escapeId(notificationsTableName)}(
        ${escapeId('id')} ${SERIAL_SQL_TYPE} NOT NULL,
        ${escapeId('subscriptionId')} ${TEXT_SQL_TYPE} NOT NULL,
        ${escapeId('incomingTimestamp')} ${LONG_INTEGER_SQL_TYPE} NOT NULL,
        ${escapeId('processStartTimestamp')} ${LONG_INTEGER_SQL_TYPE},
        ${escapeId('processEndTimestamp')} ${LONG_INTEGER_SQL_TYPE},
        ${escapeId('heartbeatTimestamp')} ${LONG_INTEGER_SQL_TYPE},
        ${escapeId('aggregateIdAndVersion')} ${TEXT_SQL_TYPE} NOT NULL,
        ${escapeId('batchId')} ${TEXT_SQL_TYPE} NULL,
        PRIMARY KEY(${escapeId('id')})
      );
      CREATE TABLE IF NOT EXISTS ${escapeId(databaseName)}.${escapeId(subscribersTableName)}(
        ${escapeId('subscriptionId')} ${STRING_SQL_TYPE} NOT NULL,
        ${escapeId('eventSubscriber')} ${STRING_SQL_TYPE} NOT NULL,
        ${escapeId('credentials')} ${JSON_SQL_TYPE} NOT NULL,
        
        ${escapeId('queueStrategy')} ${STRING_SQL_TYPE} NOT NULL,
        ${escapeId('deliveryStrategy')} ${STRING_SQL_TYPE} NOT NULL,
        ${escapeId('endpoint')} ${STRING_SQL_TYPE} NOT NULL,
        ${escapeId('eventTypes')} ${JSON_SQL_TYPE} NOT NULL,
        ${escapeId('aggregateIds')} ${JSON_SQL_TYPE} NOT NULL,
        ${escapeId('maxParallel')} ${LONG_INTEGER_SQL_TYPE},
        
        ${escapeId('successEvent')} ${JSON_SQL_TYPE},
        ${escapeId('failedEvent')} ${JSON_SQL_TYPE},
        ${escapeId('errors')} ${JSON_SQL_TYPE},
        ${escapeId('cursor')} ${STRING_SQL_TYPE},
        
        PRIMARY KEY(${escapeId('subscriptionId')})
      );
      
      CREATE INDEX IF NOT EXISTS ${escapeId(`${notificationsTableName}-subscriptionId`)}
      ON ${escapeId(databaseName)}.${escapeId(notificationsTableName)}(
      USING BTREE(${escapeId('subscriptionId')});

      GRANT USAGE ON SCHEMA ${escapeId(databaseName)} TO ${escapeId(busLogin)};
      GRANT ALL ON SCHEMA ${escapeId(databaseName)} TO ${escapeId(busLogin)};
      GRANT ALL ON ALL TABLES IN SCHEMA ${escapeId(databaseName)} TO ${escapeId(busLogin)};
      GRANT ALL ON ALL SEQUENCES IN SCHEMA ${escapeId(databaseName)} TO ${escapeId(busLogin)};
      GRANT ALL ON ALL FUNCTIONS IN SCHEMA ${escapeId(databaseName)} TO ${escapeId(busLogin)};
      ALTER SCHEMA ${escapeId(databaseName)} OWNER TO ${escapeId(busLogin)};
      `
  )
}

export async function drop({ executeStatement, escapeId, databaseName }) {
  await executeStatement(
    `DROP SCHEMA IF EXISTS ${escapeId(databaseName)} CASCADE`
  )
}
