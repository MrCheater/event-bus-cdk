export const SERIAL_SQL_TYPE = 'serial'
export const LONG_INTEGER_SQL_TYPE = 'bigint'
export const JSON_SQL_TYPE = 'jsonb'
export const STRING_SQL_TYPE = 'VARCHAR(100)'
export const TEXT_SQL_TYPE = 'TEXT'

// TODO validation

export let REGION, RESOURCE_ARN, ADMIN_SECRET_ARN, STAGE_NAME, MAJOR

export let BUS_LOGIN, DATABASE_NAME, NOTIFICATIONS_TABLE_NAME
export let SECRET_ARN, SUBSCRIBERS_TABLE_NAME, SELF_FUNCTION_NAME

function getEnv(key, maybeNull = false) {
  const value = process.env[key]
  if (!maybeNull && (value == null || value === '')) {
    throw new Error(`The environment variable "${key}" is required`)
  }
  return value
}

export function updateEnvs(context) {
  REGION = getEnv('REGION')
  RESOURCE_ARN = getEnv('RESOURCE_ARN')
  ADMIN_SECRET_ARN = getEnv('ADMIN_SECRET_ARN')
  STAGE_NAME = getEnv('STAGE_NAME')
  MAJOR = getEnv('MAJOR')
  SECRET_ARN = getEnv('SECRET_ARN', true)

  BUS_LOGIN = `${STAGE_NAME}-${MAJOR}-BUS-LOGIN`
  DATABASE_NAME = `${STAGE_NAME}-${MAJOR}-BUS-DATABASE`
  NOTIFICATIONS_TABLE_NAME = `NOTIFICATIONS-BUS-TABLE`
  SUBSCRIBERS_TABLE_NAME = `SUBSCRIBERS-BUS-TABLE`

  SELF_FUNCTION_NAME = context.functionName
}
