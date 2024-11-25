import {ExtendedStack, ExtendedStackProps} from 'truemark-cdk-lib/aws-cdk';
import {LogLevel} from './globals';
import {DomainName} from 'truemark-cdk-lib/aws-route53';
import * as path from 'path';
import {
  AppsyncFunction,
  AuthorizationType,
  Code,
  Definition,
  DynamoDbDataSource,
  FieldLogLevel,
  FunctionRuntime,
  GraphqlApi,
  MappingTemplate,
} from 'aws-cdk-lib/aws-appsync';
import {Stack} from 'aws-cdk-lib';
import {ParameterStore, ParameterStoreOptions} from 'truemark-cdk-lib/aws-ssm';
import {getDataStackParameters} from './data-stack';
import {Construct} from 'constructs';
import {RetentionDays} from 'aws-cdk-lib/aws-logs';
import {getGraphEdgeStackParameters} from './graph-edge-stack';

/**
 * Default response mapping template that maps the result to JSON.
 */
const DEFAULT_RESPONSE_MAPPING_TEMPLATE = MappingTemplate.fromString(
  '#if($ctx.result && $ctx.result.errorType)\n' +
    '  $util.error($ctx.result.errorMessage, $ctx.result.errorType, $ctx.result.stack)\n' +
    '#else\n' +
    '  $util.toJson($ctx.result)\n' +
    '#end',
);

function capitalizeFirstLetter(input: string): string {
  return input.charAt(0).toUpperCase() + input.slice(1);
}

function newJsResolverFunction(
  api: GraphqlApi,
  dataSource: DynamoDbDataSource,
  fieldName: string,
): AppsyncFunction {
  return new AppsyncFunction(
    Stack.of(api),
    `${capitalizeFirstLetter(fieldName)}Function`,
    {
      name: `${capitalizeFirstLetter(fieldName)}Function`,
      api,
      dataSource,
      runtime: FunctionRuntime.JS_1_0_0,
      code: Code.fromAsset(
        path.join(
          __dirname,
          '..',
          '..',
          'resolvers',
          'dist',
          `${fieldName.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()}.js`,
        ),
      ),
    },
  );
}

/**
 * Parameters exported by the stack. Set as an enum to prevent typos.
 */
export enum GraphStackParameterExport {
  AppSyncEndpoint = 'AppSyncEndpoint',
  AppSyncRealtimeEndpoint = 'AppSyncRealtimeEndpoint',
}

/**
 * Properties for the GraphStack.
 */
export interface GraphStackProps extends ExtendedStackProps {
  readonly dataStackParameterExportOptions: ParameterStoreOptions;
  readonly graphEdgeStackParameterExportOptions: ParameterStoreOptions;
  readonly zone: string;
  readonly prefix: string;
  readonly graphApiName: string;
  readonly logLevel: LogLevel;
  readonly oidcProvider: string;
  readonly audience: string;
}

/**
 * Deploys resources to support the Graph API.
 */
export class GraphStack extends ExtendedStack {
  constructor(scope: Construct, id: string, props: GraphStackProps) {
    super(scope, id, props);

    const dataStackParameters = getDataStackParameters(
      this,
      props.dataStackParameterExportOptions,
    );

    const graphEdgeParameters = getGraphEdgeStackParameters(
      this,
      props.graphEdgeStackParameterExportOptions,
    );

    const domainName = new DomainName({
      prefix: props.prefix,
      zone: props.zone,
    });

    const schemaPath = path.join(__dirname, '..', '..', 'schema.graphql');

    const api = new GraphqlApi(this, 'GraphqlApi', {
      name: props.graphApiName,
      definition: Definition.fromFile(schemaPath),
      domainName: {
        domainName: domainName.toString(),
        certificate: graphEdgeParameters.certificate,
      },
      logConfig: {
        excludeVerboseContent: true,
        fieldLogLevel: FieldLogLevel.ALL,
        retention: RetentionDays.ONE_WEEK,
      },
      environmentVariables: {
        accountId: Stack.of(this).account,
        audience: props.audience,
      },
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: AuthorizationType.OIDC,
          openIdConnectConfig: {
            oidcProvider: props.oidcProvider,
          },
        },
      },
    });
  }
}

/**
 * References exported by the stack.
 */
export interface GraphStackParameters {
  readonly store: ParameterStore;
  readonly appSyncEndpoint: string;
  readonly appSyncRealtimeEndpoint: string;
}

/**
 * Helper function to obtain references output from the data stack.
 *
 * @param scope The scope to create the resources in.
 * @param options The options for the parameter store.
 */
export function getGraphStackParameters(
  scope: Construct,
  options: ParameterStoreOptions,
): GraphStackParameters {
  const store = new ParameterStore(scope, 'GraphStackParameters', options);
  return {
    store,
    appSyncEndpoint: store.read(GraphStackParameterExport.AppSyncEndpoint),
    appSyncRealtimeEndpoint: store.read(
      GraphStackParameterExport.AppSyncRealtimeEndpoint,
    ),
  };
}
