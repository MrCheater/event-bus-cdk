import {
  createSecret,
  deleteSecret,
  generatePostgresPassword
} from 'resolve-cloud-common/secretsmanager'
import { updateFunctionEnvironment } from 'resolve-cloud-common/lambda'

import {
  JSON_SQL_TYPE,
  LONG_INTEGER_SQL_TYPE,
  SERIAL_SQL_TYPE,
  STRING_SQL_TYPE,
  TEXT_SQL_TYPE,
  REGION,
  ADMIN_SECRET_ARN,
  RESOURCE_ARN,
  DATABASE_NAME,
  NOTIFICATIONS_TABLE_NAME,
  SUBSCRIBERS_TABLE_NAME,
  BUS_LOGIN,
  SELF_FUNCTION_NAME
} from './constants'

import { escapeId, escapeStr, executeStatement } from './postgres'

export async function create() {
  const password = await generatePostgresPassword({ Region: REGION })
  await createUser(password)
  await createDatabase(password)
}

export async function drop() {
  await dropUser()
  await dropDatabase()
}

async function createUser(password) {
  const secretArn = await createSecret({
    Region: REGION,
    Name: BUS_LOGIN,
    SecretString: JSON.stringify({
      username: BUS_LOGIN,
      password
    }),
    Description: 'Kublet secret'
  })

  await updateFunctionEnvironment({
    Region: REGION,
    FunctionName: SELF_FUNCTION_NAME,
    Variables: {
      SECRET_ARN: secretArn
    }
  })
}

async function createDatabase(password) {
  const postgresAdmin = {
    region: REGION,
    resourceArn: RESOURCE_ARN,
    secretArn: ADMIN_SECRET_ARN
  }

  await executeStatement(postgresAdmin, `CREATE USER ${escapeId(BUS_LOGIN)};`)

  await executeStatement(
    postgresAdmin,
    `ALTER USER ${escapeId(BUS_LOGIN)} PASSWORD ${escapeStr(password)};`
  )

  await executeStatement(
    postgresAdmin,
    `CREATE SCHEMA IF NOT EXISTS ${escapeId(DATABASE_NAME)};
      CREATE TABLE IF NOT EXISTS ${escapeId(DATABASE_NAME)}.${escapeId(NOTIFICATIONS_TABLE_NAME)}(
        "id" ${SERIAL_SQL_TYPE} NOT NULL,
        "subscriptionId" ${TEXT_SQL_TYPE} NOT NULL,
        "incomingTimestamp" ${LONG_INTEGER_SQL_TYPE} NOT NULL,
        "processStartTimestamp" ${LONG_INTEGER_SQL_TYPE},
        "processEndTimestamp" ${LONG_INTEGER_SQL_TYPE},
        "heartbeatTimestamp" ${LONG_INTEGER_SQL_TYPE},
        "aggregateIdAndVersion" ${TEXT_SQL_TYPE} NOT NULL,
        "batchId" ${TEXT_SQL_TYPE} NULL,
        PRIMARY KEY("id")
      );
      CREATE TABLE IF NOT EXISTS ${escapeId(DATABASE_NAME)}.${escapeId(SUBSCRIBERS_TABLE_NAME)}(
        "subscriptionId" ${STRING_SQL_TYPE} NOT NULL,
        "eventSubscriber" ${STRING_SQL_TYPE} NOT NULL,
        "credentials" ${JSON_SQL_TYPE} NOT NULL,
        
        "queueStrategy" ${STRING_SQL_TYPE} NOT NULL,
        "deliveryStrategy" ${STRING_SQL_TYPE} NOT NULL,
        "endpoint" ${STRING_SQL_TYPE} NOT NULL,
        "eventTypes" ${JSON_SQL_TYPE} NOT NULL,
        "aggregateIds" ${JSON_SQL_TYPE} NOT NULL,
        "maxParallel" ${LONG_INTEGER_SQL_TYPE} NOT NULL,
        
        "successEvent" ${JSON_SQL_TYPE},
        "failedEvent" ${JSON_SQL_TYPE},
        "errors" ${JSON_SQL_TYPE},
        "cursor" ${STRING_SQL_TYPE},
        
        PRIMARY KEY("subscriptionId")
      );
      
      CREATE INDEX IF NOT EXISTS ${escapeId(`${NOTIFICATIONS_TABLE_NAME}-subscriptionId`)}
      ON ${escapeId(DATABASE_NAME)}.${escapeId(NOTIFICATIONS_TABLE_NAME)}
      USING BTREE("subscriptionId");

      GRANT USAGE ON SCHEMA ${escapeId(DATABASE_NAME)} TO ${escapeId(BUS_LOGIN)};
      GRANT ALL ON SCHEMA ${escapeId(DATABASE_NAME)} TO ${escapeId(BUS_LOGIN)};
      GRANT ALL ON ALL TABLES IN SCHEMA ${escapeId(DATABASE_NAME)} TO ${escapeId(BUS_LOGIN)};
      GRANT ALL ON ALL SEQUENCES IN SCHEMA ${escapeId(DATABASE_NAME)} TO ${escapeId(BUS_LOGIN)};
      GRANT ALL ON ALL FUNCTIONS IN SCHEMA ${escapeId(DATABASE_NAME)} TO ${escapeId(BUS_LOGIN)};
      ALTER SCHEMA ${escapeId(DATABASE_NAME)} OWNER TO ${escapeId(BUS_LOGIN)};
    `
  )
}

async function dropUser() {
  await deleteSecret({
    Region: REGION,
    Name: BUS_LOGIN
  })
}

export async function dropDatabase() {
  const postgresAdmin = {
    region: REGION,
    resourceArn: RESOURCE_ARN,
    secretArn: ADMIN_SECRET_ARN
  }

  await executeStatement(postgresAdmin, `DROP SCHEMA IF EXISTS ${escapeId(DATABASE_NAME)} CASCADE`)

  await executeStatement(
    postgresAdmin,
    `SELECT pg_terminate_backend(pid)
      FROM pg_stat_activity
      WHERE usename=${escapeStr(BUS_LOGIN)};`
  )
}
