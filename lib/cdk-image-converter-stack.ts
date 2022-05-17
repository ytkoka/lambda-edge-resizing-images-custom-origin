import { Stack, StackProps, Duration, RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as path from 'path';
import * as iam from 'aws-cdk-lib/aws-iam';

export class CdkImageConverterStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);



    const ImageConverterFunction  = new cloudfront.experimental.EdgeFunction(
      this,
      'ImageConverter',
      {
        code: lambda.Code.fromAsset(
          path.join(__dirname, '../resources')
        ),
        handler: 'index.handler',
        runtime: lambda.Runtime.NODEJS_14_X,
        memorySize: 512,
        timeout: Duration.seconds(10),
      }
    );
    
    ImageConverterFunction.addToRolePolicy(new iam.PolicyStatement({
      actions: ['s3:Get*', 's3:List*', 's3-object-lambda:Get*', 's3-object-lambda:List*'],
      resources: ['*'],
    }));

    // Create a private S3 bucket
    const sourceBucket = new s3.Bucket(this, 'cdk-image-converter-s3', {
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });
    // Create access identity
    const originAccessIdentity = new cloudfront.OriginAccessIdentity(
      this,
      'OAI'
    );
    sourceBucket.grantRead(originAccessIdentity);

    new s3deploy.BucketDeployment(this, 'DeployWebsite', {
      sources: [s3deploy.Source.asset(`${path.resolve(__dirname)}/../images/`)],
      destinationBucket: sourceBucket
    });

    const myCachePolicy = new cloudfront.CachePolicy(this, 'myCachePolicy', {
      cachePolicyName: 'ImageConvert',
      comment: 'Cache Policy for Image-convert',
      queryStringBehavior: cloudfront.CacheQueryStringBehavior.allowList('width', 'format'),
      defaultTtl: Duration.days(30),
      minTtl: Duration.days(1),
    });

    const distribution = new cloudfront.Distribution(this, 'Distribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(sourceBucket, {
          originAccessIdentity:  originAccessIdentity
        }),
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
        cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD,
        cachePolicy: myCachePolicy,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        edgeLambdas: [
          {
            eventType: cloudfront.LambdaEdgeEventType.ORIGIN_REQUEST,
            functionVersion: ImageConverterFunction.currentVersion,
          },
        ],
      },
    });
  }
}
