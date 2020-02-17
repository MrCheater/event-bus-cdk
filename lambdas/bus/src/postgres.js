import RDSDataService from 'aws-sdk/clients/rdsdataservice'

import { getLog, retry, Options } from 'resolve-cloud-common/utils'

const log = getLog('postgres')

export function escapeStr(str) {
  return `'${String(str).replace(/(['])/gi, '$1$1')}'`
}

export function escapeId(str) {
  return `"${String(str).replace(/(["])/gi, '$1$1')}"`
}

function coercer({
                   intValue,
                   stringValue,
                   bigIntValue,
                   longValue,
                   booleanValue,
                   isNull,
                   ...rest
                 }) {
  if (intValue != null) {
    return Number(intValue)
  }
  if (bigIntValue != null) {
    return Number(bigIntValue)
  }
  if (longValue != null) {
    return Number(longValue)
  }
  if (stringValue != null) {
    return String(stringValue)
  }
  if (booleanValue != null) {
    return Boolean(booleanValue)
  }
  if (isNull != null) {
    return null
  }
  throw new Error(`Unknown type ${JSON.stringify(rest)}`)
}


export async function executeStatement(
  { region, resourceArn, secretArn },
  sql
) {
  const rdsDataService = new RDSDataService({
    region
  })

  log.verbose(sql)

  const execute = retry(
    rdsDataService,
    rdsDataService.executeStatement,
    Options.Defaults.override({ log, maxAttempts: 1 })
  )
  const result = await execute({
    resourceArn,
    secretArn,
    database: 'postgres',
    continueAfterTimeout: false,
    includeResultMetadata: true,
    sql
  })

  const { columnMetadata, records } = result

  if (!Array.isArray(records) || columnMetadata == null) {
    return []
  }

  const rows = []
  for (const record of records) {
    const row = {}
    for (let i = 0; i < columnMetadata.length; i++) {
      const meta = columnMetadata[i]
      if (meta.name != null) {
        row[meta.name] = coercer(record[i])
      }
    }
    rows.push(row)
  }

  log.verbose(JSON.stringify(rows, null, 2))

  return rows
}
