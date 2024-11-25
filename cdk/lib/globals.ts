/**
 * Accounts and regions used in the CDK stack.
 */
export enum AwsAccount {
  Prod = 'REPLACE_ME_PROD',
  Stage = 'REPLACE_ME_STAGE',
  DevOps = 'REPLACE_ME_DEVOPS',
  Dev = 'REPLACE_ME_DEV',
}

export enum AwsRegion {
  Ireland = 'eu-west-1',
  Ohio = 'us-east-2',
  Oregon = 'us-west-2',
  SouthAfrica = 'af-south-1',
  Seoul = 'ap-northeast-2',
  Virginia = 'us-east-1',
}

export enum KmsKey {
  Cdk = 'REPLACE_ME',
}

export enum Connection {
  GitHub = 'REPLACE_ME',
}

/**
 * Default logging levels configured in the @nr1e/logging package.
 */
export type LogLevel =
  | 'silent'
  | 'trace'
  | 'debug'
  | 'info'
  | 'warn'
  | 'error'
  | 'fatal';

/**
 * The environment the app is deployed to.
 */
export type AppEnv = 'dev' | 'stage' | 'prod';
