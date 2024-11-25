import {ExtendedStack, ExtendedStackProps} from 'truemark-cdk-lib/aws-cdk';
import {Construct} from 'constructs';
import {AppEnv, LogLevel} from './globals';
import {ParameterStore, ParameterStoreOptions} from 'truemark-cdk-lib/aws-ssm';
import {getDataStackParameters} from './data-stack';
import {getGraphStackParameters} from './graph-stack';
import {AppFunction} from './app-function';
import {CloudFrontBucketV2} from 'truemark-cdk-lib/aws-s3';
import {Duration, Fn, RemovalPolicy} from 'aws-cdk-lib';
import * as path from 'path';
import {Bucket, IBucket} from 'aws-cdk-lib/aws-s3';

/**
 * Parameters exported by the stack. Set as an enum to prevent typos.
 */
export enum AppStackParameterExport {
  FunctionUrl = 'FunctionUrl',
  ContentBucketArn = 'ContentBucketArn',
  ContentOriginAccessControlId = 'ContentOriginAccessControlId',
}

export interface AppStackProps extends ExtendedStackProps {
  readonly dataStackParameterExportOptions: ParameterStoreOptions;
  readonly graphStackParameterExportOptions: ParameterStoreOptions;
  readonly logLevel: LogLevel;
  readonly appEnv: AppEnv;
  readonly canaryDeploy: boolean;
}

export class AppStack extends ExtendedStack {
  constructor(scope: Construct, id: string, props: AppStackProps) {
    super(scope, id, props);

    const dataStackParameters = getDataStackParameters(
      this,
      props.dataStackParameterExportOptions,
    );

    const graphStackParameters = getGraphStackParameters(
      this,
      props.graphStackParameterExportOptions,
    );

    const fn = new AppFunction(this, 'AppFunction', {
      logLevel: props.logLevel,
      dataTable: dataStackParameters.dataTable,
      canaryDeploy: props.canaryDeploy,
      graphEndpoint: graphStackParameters.appSyncEndpoint,
      graphRealtimeEndpoint: graphStackParameters.appSyncRealtimeEndpoint,
    });
    this.exportAndOutputParameter(
      AppStackParameterExport.FunctionUrl,
      fn.functionUrl.url,
    );

    const contentBucket = new CloudFrontBucketV2(this, 'Content', {
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });
    this.exportAndOutputParameter(
      AppStackParameterExport.ContentBucketArn,
      contentBucket.bucketArn,
    );
    this.exportAndOutputParameter(
      AppStackParameterExport.ContentOriginAccessControlId,
      contentBucket.originAccessControlId,
    );
    contentBucket.deploy([
      {
        source: path.join('..', 'app', 'dist'),
        exclude: ['build', 'assets'],
        maxAge: Duration.minutes(1),
        sMaxAge: Duration.minutes(2),
      },
      // {
      //   source: path.join('..', 'site', 'dist', 'assets'),
      //   prefix: 'assets',
      //   maxAge: Duration.days(1),
      //   sMaxAge: Duration.days(7),
      // },
      {
        source: path.join('..', 'app', 'dist', 'build'),
        prefix: 'build',
        maxAge: Duration.days(1),
        sMaxAge: Duration.days(7),
      },
    ]);
  }
}

/**
 * References exported by the stack.
 */
export interface AppStackParameters {
  readonly store: ParameterStore;
  readonly functionUrl: string;
  readonly functionOrigin: string;
  readonly contentBucket: IBucket;
}

/**
 * Helper function to obtain references output from the data stack.
 *
 * @param scope The scope to create the resources in.
 * @param options The options for the parameter store.
 */
export function getAppStackParameters(
  scope: Construct,
  options: ParameterStoreOptions,
): AppStackParameters {
  const store = new ParameterStore(scope, 'AppStackParameters', options);
  const contentBucketArn = store.read(AppStackParameterExport.ContentBucketArn);
  const contentBucket = Bucket.fromBucketAttributes(scope, 'Content', {
    bucketArn: contentBucketArn,
    region: store.region,
  });
  // We just need the origin for CloudFront, not the entire URL
  const functionUrl = store.read(AppStackParameterExport.FunctionUrl);
  // Split the URL by '//' to separate the 'https:' prefix
  const splitByDoubleSlash = Fn.split('//', functionUrl);
  // Select the second part of the split (the URL without 'https:')
  const urlWithoutHttps = Fn.select(1, splitByDoubleSlash);
  // Split the URL by '/' to separate the trailing '/'
  const splitBySlash = Fn.split('/', urlWithoutHttps);
  // Select the first part of the split (the URL without the trailing '/')
  const functionOrigin = Fn.select(0, splitBySlash);
  return {
    store,
    functionUrl,
    functionOrigin,
    contentBucket,
  };
}
