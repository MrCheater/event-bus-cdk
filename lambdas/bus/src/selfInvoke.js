import { invokeFunction } from 'resolve-cloud-common/lambda'
import { REGION, SELF_FUNCTION_NAME } from './constants'

export async function selfInvoke(payload) {
  await invokeFunction({
    Region: REGION,
    FunctionName: SELF_FUNCTION_NAME,
    InvocationType: 'Event',
    Payload: payload
  })
}
