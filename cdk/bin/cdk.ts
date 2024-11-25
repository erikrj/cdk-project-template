#!/usr/bin/env node
import 'source-map-support/register';
import {ExtendedApp} from 'truemark-cdk-lib/aws-cdk';
import {AwsAccount} from '../lib/globals';
import {DataStack} from '../lib/data-stack';
import {RemovalPolicy} from 'aws-cdk-lib';
import {GraphEdgeStack} from '../lib/graph-edge-stack';
import {GraphStack} from '../lib/graph-stack';
import {AppStack} from '../lib/app-stack';
import {AppEdgeStack} from '../lib/app-edge-stack';

const app = new ExtendedApp({
  standardTags: {
    automationTags: {
      // TODO Replace with your automation tags
      id: 'replaceme',
      url: 'https://github.com/replaceme/replaceme.git',
    },
    costCenterTags: {
      // TODO Replace with your cost center tags and add additional tags as needed
      projectId: 'replaceme',
      projectName: 'ReplaceMe',
    },
    teamTags: {
      // TODO Replace with your team tags and add additional tags as needed
      name: 'Replace Me',
      id: 'replaceme',
      contactName: 'Replace Me',
      contactEmail: 'replaceme@example.com',
    },
  },
});

if (app.account === AwsAccount.Dev) {
  const dataStack = new DataStack(app, `Data`, {
    replicationRegions: [],
    removalPolicy: RemovalPolicy.DESTROY,
  });
  const graphEdgeStack = new GraphEdgeStack(app, `GraphEdge`, {
    // TODO Replace with the correct zone and prefix
    zone: 'dev.example.com',
    prefix: 'graph',
  });
  const graphStack = new GraphStack(app, `Graph`, {
    dataStackParameterExportOptions: dataStack.parameterExportOptions,
    graphEdgeStackParameterExportOptions: graphEdgeStack.parameterExportOptions,
    // TODO Replace with the correct zone and prefix
    zone: 'dev.example.com',
    prefix: 'graph',
    // TODO Replace with the correct name
    graphApiName: 'ReplaceMeDev',
    logLevel: 'trace',
    // TODO Replace with the correct oidc provider
    oidcProvider: 'replaceme',
    // TODO Replace with the correct audience
    audience: 'replaceme',
  });
  const appStack = new AppStack(app, `App`, {
    dataStackParameterExportOptions: dataStack.parameterExportOptions,
    graphStackParameterExportOptions: graphStack.parameterExportOptions,
    logLevel: 'trace',
    appEnv: 'dev',
    canaryDeploy: false,
  });
  new AppEdgeStack(app, `AppEdge`, {
    appStackParameterExportOptions: appStack.parameterExportOptions,
    // TODO Replace with the correct zone and prefix
    zone: 'dev.example.com',
    prefix: 'app',
    robotsBehavior: 'Disallow',
    invalidate: true,
  });
}
