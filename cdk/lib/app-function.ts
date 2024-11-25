import {ExtendedNodejsFunction} from 'truemark-cdk-lib/aws-lambda';
import {
  Architecture,
  Code,
  FunctionUrl,
  FunctionUrlAuthType,
  InvokeMode,
  Runtime,
} from 'aws-cdk-lib/aws-lambda';
import {Construct} from 'constructs';
import * as path from 'path';
import {LogLevel} from './globals';
import {ITableV2} from 'aws-cdk-lib/aws-dynamodb';
import {LambdaDeploymentConfig} from 'aws-cdk-lib/aws-codedeploy';

/**
 * Properties for the AppFunction.
 */
export interface AppFunctionProps {
  readonly logLevel: LogLevel;
  readonly dataTable: ITableV2;
  readonly canaryDeploy: boolean;
  readonly graphEndpoint: string;
  readonly graphRealtimeEndpoint: string;
}

/**
 * Function for serving the QwikJS application.
 */
export class AppFunction extends ExtendedNodejsFunction {
  readonly functionUrl: FunctionUrl;
  constructor(scope: Construct, id: string, props: AppFunctionProps) {
    super(scope, id, {
      // This assumes the application is build before a cdk synth occurs
      code: Code.fromAsset(path.join(__dirname, '..', '..', 'app', 'server')),
      handler: 'entry-aws-lambda.qwikApp',
      memorySize: 1024,
      runtime: Runtime.NODEJS_20_X,
      architecture: Architecture.ARM_64,
      environment: {
        NODE_OPTIONS: '--enable-source-maps',
        HOST_HEADER: 'x-forwarded-host',
        PROTOCOL_HEADER: 'x-forwarded-proto',
        LOG_LEVEL: props.logLevel,
        DATA_TABLE_NAME: props.dataTable.tableName,
        GRAPH_ENDPOINT: props.graphEndpoint,
        GRAPH_REALTIME_ENDPOINT: props.graphRealtimeEndpoint,
      },
      criticalAlarmOptions: {
        // TODO Add metric log filter pattern for nr1e/logging
        maxLogCount: 0, // Disables a default alarm that would be created
      },
      warningAlarmOptions: {
        // TODO Add metric log filter pattern for nr1e/logging
        maxLogCount: 0, // Disables a default alarm that would be created
      },
      deploymentOptions: {
        createDeployment: props.canaryDeploy,
        includeCriticalAlarms: props.canaryDeploy,
        // TODO Adjust canary deployment config to your needs
        deploymentConfig: LambdaDeploymentConfig.CANARY_10PERCENT_5MINUTES,
      },
    });
    // Expose the function URL as an output
    this.functionUrl = this.addFunctionUrl({
      authType: FunctionUrlAuthType.NONE,
      // TODO Move to streaming when Qwik supports it. This is not a function of serverless-http
      invokeMode: InvokeMode.BUFFERED,
    });
    // Allow this function to read and write to the DynamoDBV2 table
    props.dataTable.grantWriteData(this);
  }
}
