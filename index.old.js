import path from 'path'

import * as cdk from '@aws-cdk/core'
import * as assets from '@aws-cdk/aws-s3-assets'
import * as lambda from '@aws-cdk/aws-lambda'
import * as iam from '@aws-cdk/aws-iam'
import * as rds from '@aws-cdk/aws-rds'

const monorepoRoot = path.join(__dirname)

class Stack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props)

    // const busAsset = new assets.Asset(this, 'Bus', {
    //   path: path.join(monorepoRoot, '.lambdas', 'bus.zip')
    // })

    const busRole = new iam.Role(this, 'bus-role', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      inlinePolicies: {
        'bus-role-policy': new iam.PolicyDocument({
          statements:[
            new iam.PolicyStatement({
              actions: [''],
              resources: ['arn:aws:rds:us-east-1:650139044964:cluster:postgresql-serverless'],
              effect: iam.Effect.ALLOW
            })
          ]
        })
      },
      // custom description if desired
      description: 'This is a custom role...',
    });

    const busLambda = new lambda.Function(this, 'bus-lambda', {
      code: lambda.Code.fromAsset(path.join(monorepoRoot, '.lambdas', 'bus.zip')),
      //lambda.Code.fromAsset(busAsset.assetPath),
      handler: 'index.default',
      timeout: cdk.Duration.seconds(300),
      runtime: lambda.Runtime.NODEJS_10_X,
      environment: {
        REGION: process.env.REGION,
        RESOURCE_ARN: process.env.RESOURCE_ARN,
        ADMIN_SECRET_ARN: process.env.ADMIN_SECRET_ARN,
        STAGE_NAME: process.env.STAGE_NAME,
        MAJOR: process.env.MAJOR
      }
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
