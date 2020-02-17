export const SERIAL_SQL_TYPE = 'serial'
export const LONG_INTEGER_SQL_TYPE = 'bigint'
export const JSON_SQL_TYPE = 'jsonb'
export const STRING_SQL_TYPE = 'VARCHAR(100)'
export const TEXT_SQL_TYPE = 'TEXT'

// TODO validation

export const {
  DATABASE_NAME,
  REGION,
  RESOURCE_ARN,
  SECRET_ARN,
  BUS_LOGIN,
  NOTIFICATIONS_TABLE_NAME,
  SUBSCRIBERS_TABLE_NAME
} = process.env
