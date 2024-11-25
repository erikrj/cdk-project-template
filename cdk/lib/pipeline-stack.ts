import {
  ExtendedStack,
  ExtendedStackProps,
  SingleStackStage,
} from 'truemark-cdk-lib/aws-cdk';
import {Construct} from 'constructs';
import {
  CdkPipeline,
  NodePackageManager,
  NodeVersion,
} from 'truemark-cdk-lib/aws-codepipeline';
import {AwsAccount, AwsRegion, Connection, KmsKey} from './globals';
import {ComputeType} from 'aws-cdk-lib/aws-codebuild';
import {DataStack} from './data-stack';
import {RemovalPolicy} from 'aws-cdk-lib';
import {GraphEdgeStack} from './graph-edge-stack';
import {GraphStack} from './graph-stack';
import {AppStack} from './app-stack';
import {AppEdgeStack} from './app-edge-stack';

/**
 * Properties for the PipelineStack.
 */
export type PipelineStackProps = ExtendedStackProps;

/**
 * Sets up and configures the AWS CodePipeline to deploy to Stage and Prod environments.
 */
export class PipelineStack extends ExtendedStack {
  constructor(scope: Construct, id: string, props: PipelineStackProps) {
    super(scope, id, props);

    const pipeline = new CdkPipeline(this, 'Pipeline', {
      cdkDirectory: 'cdk',
      // TODO Replace the pipeline name
      pipelineName: 'ReplaceMe',
      selfMutation: true,
      keyArn: KmsKey.Cdk,
      connectionArn: Connection.GitHub,
      // TODO Replace the repository
      repository: 'replace/mo',
      branch: 'main',
      accountIds: [AwsAccount.Prod, AwsAccount.Stage],
      packageManager: NodePackageManager.PNPM,
      nodeVersion: NodeVersion.NODE_22,
      preBuildCommands: [
        'cd ../ && pnpm i --frozen-lockfile && pnpm build && pnpm test && cd cdk',
      ],
      computeType: ComputeType.MEDIUM,
    });

    ///////////////////////////////////////////////////////////////////////////
    // Stage
    ///////////////////////////////////////////////////////////////////////////
    const stageGlobalWave = pipeline.addWave('StageGlobal');

    const stageData = new SingleStackStage(this, `${id}-StageData`, {
      id: 'Data',
      cls: DataStack,
      props: {
        replicationRegions: [],
        removalPolicy: RemovalPolicy.RETAIN,
      },
      env: {account: AwsAccount.Stage, region: AwsRegion.Ohio},
    });
    stageGlobalWave.addStage(stageData);

    const stageGraphEdge = new SingleStackStage(this, `${id}-StageGraphEdge`, {
      id: 'GraphEdge',
      cls: GraphEdgeStack,
      props: {
        // TODO Replace with the correct route53 zone
        zone: 'stage.example.com',
        // TODO Replace with the correct prefix for the zone
        prefix: 'graph',
      },
      env: {account: AwsAccount.Stage, region: AwsRegion.Virginia},
    });
    stageGlobalWave.addStage(stageGraphEdge);

    const stageGraph = new SingleStackStage(this, `${id}-StageGraph`, {
      id: 'Graph',
      cls: GraphStack,
      props: {
        dataStackParameterExportOptions: stageData.stack.parameterExportOptions,
        graphEdgeStackParameterExportOptions:
          stageGraphEdge.stack.parameterExportOptions,
        // TODO Replace with the correct route53 zone
        zone: 'stage.example.com',
        // TODO Replace with the correct prefix for the zone
        prefix: 'graph',
        // TODO Replace with the correct name
        graphApiName: 'ReplaceMeStage',
        // TODO Replace with desired log level
        logLevel: 'trace',
        // TODO Replace with the correct oidc provider
        oidcProvider: 'replaceme',
        // TODO Replace with the correct audience
        audience: 'replaceme',
      },
      env: {account: AwsAccount.Stage, region: AwsRegion.Ohio},
    });
    pipeline.addStage(stageGraph);

    const stageApp = new SingleStackStage(this, `${id}-StageApp`, {
      id: 'App',
      cls: AppStack,
      props: {
        dataStackParameterExportOptions: stageData.stack.parameterExportOptions,
        graphStackParameterExportOptions:
          stageGraph.stack.parameterExportOptions,
        // TODO Replace with desired log level
        logLevel: 'trace',
        appEnv: 'stage',
        canaryDeploy: false,
      },
      env: {account: AwsAccount.Stage, region: AwsRegion.Ohio},
    });
    pipeline.addStage(stageApp);

    const stageAppEdge = new SingleStackStage(this, `${id}-StageAppEdge`, {
      id: 'AppEdge',
      cls: AppEdgeStack,
      props: {
        appStackParameterExportOptions: stageApp.stack.parameterExportOptions,
        // TODO Replace with the correct route53 zone
        zone: 'example.com',
        prefix: 'replaceme',
        robotsBehavior: 'Disallow',
        invalidate: true,
      },
      env: {account: AwsAccount.Stage, region: AwsRegion.Virginia},
    });
    pipeline.addStage(stageAppEdge);

    ///////////////////////////////////////////////////////////////////////////
    // Pre
    ///////////////////////////////////////////////////////////////////////////
    const preGlobalWave = pipeline.addWave('PreGlobal');

    const prodData = new SingleStackStage(this, `${id}-ProdData`, {
      id: 'Data',
      cls: DataStack,
      props: {
        replicationRegions: [],
        removalPolicy: RemovalPolicy.RETAIN,
      },
      env: {account: AwsAccount.Prod, region: AwsRegion.Ohio},
    });
    preGlobalWave.addStage(prodData);

    const preGraphEdge = new SingleStackStage(this, `${id}-PreGraphEdge`, {
      id: 'GraphEdge',
      cls: GraphEdgeStack,
      props: {
        // TODO Replace with the correct route53 zone
        zone: 'pre.example.com',
        // TODO Replace with the correct prefix for the zone
        prefix: 'graph',
      },
      env: {account: AwsAccount.Prod, region: AwsRegion.Virginia},
    });
    preGlobalWave.addStage(preGraphEdge);

    const preGraph = new SingleStackStage(this, `${id}-PreGraph`, {
      id: 'Graph',
      cls: GraphStack,
      props: {
        dataStackParameterExportOptions: prodData.stack.parameterExportOptions,
        graphEdgeStackParameterExportOptions:
          stageGraphEdge.stack.parameterExportOptions,
        // TODO Replace with the correct route53 zone
        zone: 'stage.example.com',
        // TODO Replace with the correct prefix for the zone
        prefix: 'graph',
        // TODO Replace with the correct name
        graphApiName: 'ReplaceMeStage',
        // TODO Replace with desired log level
        logLevel: 'trace',
        // TODO Replace with the correct oidc provider
        oidcProvider: 'replaceme',
        // TODO Replace with the correct audience
        audience: 'replaceme',
      },
      env: {account: AwsAccount.Prod, region: AwsRegion.Ohio},
    });
    pipeline.addStage(preGraph);

    const preApp = new SingleStackStage(this, `${id}-PreApp`, {
      id: 'App',
      cls: AppStack,
      props: {
        dataStackParameterExportOptions: prodData.stack.parameterExportOptions,
        graphStackParameterExportOptions: preGraph.stack.parameterExportOptions,
        // TODO Replace with desired log level
        logLevel: 'trace',
        appEnv: 'prod',
        canaryDeploy: false,
      },
      env: {account: AwsAccount.Prod, region: AwsRegion.Ohio},
    });
    pipeline.addStage(preApp);

    const preAppEdge = new SingleStackStage(this, `${id}-PreAppEdge`, {
      id: 'AppEdge',
      cls: AppEdgeStack,
      props: {
        appStackParameterExportOptions: preApp.stack.parameterExportOptions,
        // TODO Replace with the correct route53 zone
        zone: 'example.com',
        prefix: 'replaceme',
        robotsBehavior: 'Disallow',
        invalidate: true,
      },
      env: {account: AwsAccount.Prod, region: AwsRegion.Virginia},
    });
    pipeline.addStage(preAppEdge);

    ///////////////////////////////////////////////////////////////////////////
    // Prod
    ///////////////////////////////////////////////////////////////////////////
    const prodGlobalWave = pipeline.addWave('ProdGlobal');

    const prodGraphEdge = new SingleStackStage(this, `${id}-ProdGraphEdge`, {
      id: 'GraphEdge',
      cls: GraphEdgeStack,
      props: {
        // TODO Replace with the correct route53 zone
        zone: 'example.com',
        // TODO Replace with the correct prefix for the zone
        prefix: 'graph',
      },
      env: {account: AwsAccount.Prod, region: AwsRegion.Virginia},
    });
    prodGlobalWave.addStage(prodGraphEdge);

    const prodGraph = new SingleStackStage(this, `${id}-ProdGraph`, {
      id: 'Graph',
      cls: GraphStack,
      props: {
        dataStackParameterExportOptions: prodData.stack.parameterExportOptions,
        graphEdgeStackParameterExportOptions:
          stageGraphEdge.stack.parameterExportOptions,
        // TODO Replace with the correct route53 zone
        zone: 'stage.example.com',
        // TODO Replace with the correct prefix for the zone
        prefix: 'graph',
        // TODO Replace with the correct name
        graphApiName: 'ReplaceMeStage',
        // TODO Replace with desired log level
        logLevel: 'trace',
        // TODO Replace with the correct oidc provider
        oidcProvider: 'replaceme',
        // TODO Replace with the correct audience
        audience: 'replaceme',
      },
      env: {account: AwsAccount.Prod, region: AwsRegion.Ohio},
    });
    pipeline.addStage(prodGraph);

    const prodApp = new SingleStackStage(this, `${id}-ProdApp`, {
      id: 'App',
      cls: AppStack,
      props: {
        dataStackParameterExportOptions: prodData.stack.parameterExportOptions,
        graphStackParameterExportOptions:
          prodGraph.stack.parameterExportOptions,
        // TODO Replace with desired log level
        logLevel: 'trace',
        appEnv: 'prod',
        canaryDeploy: false,
      },
      env: {account: AwsAccount.Prod, region: AwsRegion.Ohio},
    });
    pipeline.addStage(prodApp);

    const prodAppEdge = new SingleStackStage(this, `${id}-ProdAppEdge`, {
      id: 'AppEdge',
      cls: AppEdgeStack,
      props: {
        appStackParameterExportOptions: prodApp.stack.parameterExportOptions,
        // TODO Replace with the correct route53 zone
        zone: 'example.com',
        prefix: 'replaceme',
        robotsBehavior: 'Disallow',
        invalidate: true,
      },
      env: {account: AwsAccount.Prod, region: AwsRegion.Virginia},
    });
    pipeline.addStage(prodAppEdge);
  }
}
