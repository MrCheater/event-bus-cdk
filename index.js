import path from 'path'

import * as cdk from '@aws-cdk/core'
import * as assets from '@aws-cdk/aws-s3-assets'
import * as lambda from '@aws-cdk/aws-lambda'

const monorepoRoot = path.join(__dirname)

class Stack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const busAsset = new assets.Asset(this, 'Bus', {
      path: path.join(
        monorepoRoot,
        '.lambdas',
        'bus.zip'
      )
    })

    const busLambda = new lambda.Function(this, 'bus-lambda', {
      code: lambda.Code.fromAsset(path.join(
        monorepoRoot,
        '.lambdas',
        'bus.zip'
      )),
      //lambda.Code.fromAsset(busAsset.assetPath),
      handler: 'index.default',
      timeout: cdk.Duration.seconds(300),
      runtime: lambda.Runtime.NODEJS_10_X
    })
  }
}

const app = new cdk.App()

new Stack(app, 'Eventbus-Stack', {
  env: {
    region: 'us-east-1',
    account: '650139044964'
  }
})

