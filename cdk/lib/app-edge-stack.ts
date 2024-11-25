import {ExtendedStack, ExtendedStackProps} from 'truemark-cdk-lib/aws-cdk';
import {Construct} from 'constructs';
import {ParameterStoreOptions} from 'truemark-cdk-lib/aws-ssm';
import {HttpOrigin, S3BucketOrigin} from 'aws-cdk-lib/aws-cloudfront-origins';
import {
  AccessLevel,
  OriginProtocolPolicy,
  OriginSslPolicy,
} from 'aws-cdk-lib/aws-cloudfront';
import {Duration, Stack} from 'aws-cdk-lib';
import {DomainName} from 'truemark-cdk-lib/aws-route53';
import {CloudFrontTarget} from 'aws-cdk-lib/aws-route53-targets';
import {RecordTarget} from 'aws-cdk-lib/aws-route53';
import {
  DistributionBuilder,
  Invalidation,
  RobotsBehavior,
} from 'truemark-cdk-lib/aws-cloudfront';
import {getAppStackParameters} from './app-stack';
import {AwsRegion} from './globals';

/**
 * Properties for the EdgeStack.
 */
export interface AppEdgeStackProps extends ExtendedStackProps {
  /**
   * The app stack parameter export options.
   */
  readonly appStackParameterExportOptions: ParameterStoreOptions;
  /**
   * The route53 zone to use.
   */
  readonly zone: string;
  /**
   * The prefix to use for DNS;
   */
  readonly prefix: string;
  /**
   * The behavior for the /robots.txt file. Default is 'Disallow'.
   */
  readonly robotsBehavior: RobotsBehavior;
  /**
   * Whether to invalidate the CloudFront distribution. Default is `false`.
   */
  readonly invalidate: boolean;
}

/**
 * Deploys edge resources like CloudFront.
 */
export class AppEdgeStack extends ExtendedStack {
  constructor(scope: Construct, id: string, props: AppEdgeStackProps) {
    super(scope, id, props);
    if (Stack.of(this).region !== AwsRegion.Virginia) {
      throw new Error('AppEdgeStack must be deployed in us-east-1');
    }

    const appStackParameters = getAppStackParameters(
      this,
      props.appStackParameterExportOptions,
    );

    // Create the origin to hit the site lambda function found in the app stack
    const appOrigin = new HttpOrigin(appStackParameters.functionOrigin, {
      originId: 'app-function-origin',
      protocolPolicy: OriginProtocolPolicy.HTTPS_ONLY,
      originSslProtocols: [OriginSslPolicy.TLS_V1_2],
      readTimeout: Duration.seconds(30),
      keepaliveTimeout: Duration.seconds(60),
    });

    // Create the origin to hit the content bucket found in the app stack
    const contentOrigin = S3BucketOrigin.withOriginAccessControl(
      appStackParameters.contentBucket,
      {
        originId: 'app-content-origin',
        originAccessLevels: [AccessLevel.READ],
      },
    );

    const rootDomainName = new DomainName({
      prefix: props.prefix,
      zone: props.zone,
    });
    const altDomainName = new DomainName({
      prefix: `www.${props.prefix}`,
      zone: props.zone,
    });

    const certificate = rootDomainName.createCertificate(this, {
      subjectAlternativeNames: [altDomainName.toString()],
    });

    // Create the CloudFront distribution
    const distribution = new DistributionBuilder(this, 'Default')
      .domainName(rootDomainName)
      .domainName(altDomainName)
      .certificate(certificate)
      .behavior(appOrigin)
      .apiDefaults(['X-Qrl']) // headers used by QwikJS RPC
      .redirectFunction({
        apexDomain: rootDomainName, // Redirect to the root domain from www
        indexFile: '', // Not a static website so we don't want to forward to an index file
        trailingSlashBehavior: 'None', // Not applicable since this is not a static website
        noFileExtensionBehavior: 'None', // Not applicable since this is not a static website
        robotsBehavior: props.robotsBehavior ?? 'Disallow', // Apply the /robots.txt behavior so we don't index outside of production
      })
      // The following paths are specific to QwikJS
      .behavior(contentOrigin, 'build/*')
      .s3Defaults()
      .behavior(contentOrigin, 'images/*')
      .s3Defaults()
      .behavior(contentOrigin, 'assets/*')
      .s3Defaults()
      .behavior(contentOrigin, 'favicon*')
      .s3Defaults()
      .behavior(contentOrigin, 'android-*')
      .s3Defaults()
      .behavior(contentOrigin, 'apple-*')
      .s3Defaults()
      .behavior(contentOrigin, '404.html')
      .s3Defaults()
      .behavior(contentOrigin, 'service-worker.js')
      .s3Defaults()
      .behavior(contentOrigin, 'qwik-prefetch-service-worker.js')
      .s3Defaults()
      .behavior(contentOrigin, 'q-manifest.json')
      .s3Defaults()
      .behavior(contentOrigin, 'manifest.json')
      .s3Defaults()
      .behavior(contentOrigin, 'sitemap.xml')
      .s3Defaults()
      .toDistribution();

    // Point DNS to the CloudFront distribution
    const target = new CloudFrontTarget(distribution);
    rootDomainName.createARecord(this, RecordTarget.fromAlias(target));
    altDomainName.createARecord(this, RecordTarget.fromAlias(target));

    this.outputParameter('Endpoint', `https://${rootDomainName.toString()}`);

    if (props.invalidate ?? false) {
      // Typically invalidation should not be necessary.
      // Content should have CDN friendly hashes in the name and proper cache headers should be used on responses.
      new Invalidation(this, 'Invalidation', {
        distributionId: distribution.distributionId,
        paths: ['/*'],
      });
    }
  }
}
