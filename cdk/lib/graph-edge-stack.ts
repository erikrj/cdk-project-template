import {ExtendedStack, ExtendedStackProps} from 'truemark-cdk-lib/aws-cdk';
import {Construct} from 'constructs';
import {DomainName} from 'truemark-cdk-lib/aws-route53';
import {ParameterStore, ParameterStoreOptions} from 'truemark-cdk-lib/aws-ssm';
import {Certificate, ICertificate} from 'aws-cdk-lib/aws-certificatemanager';
import {AwsRegion} from './globals';
import {Stack} from 'aws-cdk-lib';

/**
 * Parameters exported by the stack. Set as an enum to prevent typos.
 */
export enum GraphEdgeStackParameterExport {
  CertificateArn = 'CertificateArn',
}

/**
 * Properties for GraphEdgeStack.
 */
export interface GraphEdgeStackProps extends ExtendedStackProps {
  readonly zone: string;
  readonly prefix: string;
}

/**
 * Creates resources in us-east-1 for the Graph API.
 */
export class GraphEdgeStack extends ExtendedStack {
  constructor(scope: Construct, id: string, props: GraphEdgeStackProps) {
    super(scope, id, props);
    if (Stack.of(this).region !== AwsRegion.Virginia) {
      throw new Error('GraphEdgeStack must be deployed in us-east-1');
    }
    const domainName = new DomainName({
      prefix: props.prefix,
      zone: props.zone,
    });
    const certificate = domainName.createCertificate(this);
    this.exportParameter(
      GraphEdgeStackParameterExport.CertificateArn,
      certificate.certificateArn,
    );
  }
}

/**
 * References exported by the stack.
 */
export interface GraphEdgeStackParameters {
  readonly store: ParameterStore;
  readonly certificate: ICertificate;
}

/**
 * Helper method to pull the stack parameters from the parameter store.
 *
 * @param scope the scope to create constructs in
 * @param options the parameter store options
 */
export function getGraphEdgeStackParameters(
  scope: Construct,
  options: ParameterStoreOptions,
): GraphEdgeStackParameters {
  const store = new ParameterStore(scope, 'GraphEdgeParameters', options);
  const certificateArn = store.read(
    GraphEdgeStackParameterExport.CertificateArn,
  );
  const certificate = Certificate.fromCertificateArn(
    scope,
    'Certificate',
    certificateArn,
  );
  return {
    store,
    certificate,
  };
}
