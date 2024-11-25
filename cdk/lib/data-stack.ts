import {RemovalPolicy} from 'aws-cdk-lib';
import {ExtendedStack, ExtendedStackProps} from 'truemark-cdk-lib/aws-cdk';
import {Construct} from 'constructs';
import {StandardTableV2} from 'truemark-cdk-lib/aws-dynamodb';
import {ParameterStore, ParameterStoreOptions} from 'truemark-cdk-lib/aws-ssm';
import {ITableV2, TableV2} from 'aws-cdk-lib/aws-dynamodb';

/**
 * Parameters exported by the stack. Set as an enum to prevent typos.
 */
export enum DataStackParameterExport {
  DataTableName = 'DataTableName',
}

/**
 * Properties for DataStack.
 */
export interface DataStackProps extends ExtendedStackProps {
  readonly replicationRegions: string[];
  readonly removalPolicy: RemovalPolicy;
}

/**
 * This is a single region stack that holds persistent resources like DynamoDB
 * table may be replicated across regions.
 */
export class DataStack extends ExtendedStack {
  constructor(scope: Construct, id: string, props: DataStackProps) {
    super(scope, id, props);

    const dataV2Table = new StandardTableV2(this, 'Data', {
      removalPolicy: props.removalPolicy,
      deletionProtection: props.removalPolicy !== RemovalPolicy.DESTROY,
      replicas:
        props.replicationRegions?.map((region) => ({
          region,
        })) ?? [],
      // TODO Add global secondary indexes as needed or change definition
      globalSecondaryIndexes: 1,
      pointInTimeRecovery: props.removalPolicy === RemovalPolicy.RETAIN,
    });
    this.exportAndOutputParameter(
      DataStackParameterExport.DataTableName,
      dataV2Table.tableName,
    );
  }
}

/**
 * References exported by the stack.
 */
export interface DataStackParameters {
  readonly store: ParameterStore;
  readonly dataTable: ITableV2;
}

/**
 * Helper function to obtain references output from the data stack.
 *
 * @param scope The scope to create the resources in.
 * @param options The options for the parameter store.
 */
export function getDataStackParameters(
  scope: Construct,
  options: ParameterStoreOptions,
): DataStackParameters {
  const store = new ParameterStore(scope, 'DataStackParameters', options);
  const dataTableName = store.read(DataStackParameterExport.DataTableName);
  const dataTable = TableV2.fromTableAttributes(scope, 'DataTable', {
    tableName: dataTableName,
    // TODO Add global secondary indexes as needed or change definition
    globalIndexes: ['Gs1'],
  });
  return {
    store,
    dataTable,
  };
}
