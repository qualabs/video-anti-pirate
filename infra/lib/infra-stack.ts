import * as cdk from '@aws-cdk/core';
import * as dynamodb from '@aws-cdk/aws-dynamodb';
import * as s3 from '@aws-cdk/aws-s3';
import * as s3deploy from '@aws-cdk/aws-s3-deployment';
import * as iam from '@aws-cdk/aws-iam'

export class InfraStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Deploy DynamoDB tables
    const wmKeys = new dynamodb.Table(this, 'wm-keys', {
      partitionKey: { name: 'content_id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'kid', type: dynamodb.AttributeType.STRING },
      tableName: 'wm-keys',
      timeToLiveAttribute: "expiry"
    });
    const wmControl = new dynamodb.Table(this, 'wm-control', {
      partitionKey: { name: 'sessionId', type: dynamodb.AttributeType.STRING },
      tableName: 'wm-control'
    });

    // Deploy admin site
    const websiteBucket = new s3.Bucket(this, 'AdminSite', {
      websiteIndexDocument: 'index.html',
      publicReadAccess: true
    });

    new s3deploy.BucketDeployment(this, 'DeployWebsite', {
      sources: [s3deploy.Source.asset('../front/build')],
      destinationBucket: websiteBucket
    });

    new cdk.CfnOutput(this, 'AdminSiteURL', { value: websiteBucket.urlForObject("index.html") });

    // Deploy Role for MediaPackage
    const role = new iam.Role(this, 'SpekeRole', {
      assumedBy: new iam.ServicePrincipal('mediapackage.amazonaws.com'),
    });

    role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonS3FullAccess"));
    role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonAPIGatewayInvokeFullAccess"));

    new cdk.CfnOutput(this, 'EncryptionRole', { value: role.roleArn });
  }
}
