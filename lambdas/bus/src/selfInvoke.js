import { invokeFunction } from 'resolve-cloud-common/lambda'

export async function selfInvoke({ region, selfFunctionName }, payload) {
  invokeFunction({
    Region: region,
    FunctionName: selfFunctionName,
    InvocationType: 'Event',
    Payload: payload
  })


}
