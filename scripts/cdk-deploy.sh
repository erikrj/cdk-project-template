#!/usr/bin/env bash

set -euo pipefail
cd "$(dirname "${0}")/../cdk" || exit 1

command=${1:-deploy}

# Global
npx aws-cdk@2.x ${command} Platform/DataStack --require-approval never
npx aws-cdk@2.x ${command} Platform/GraphSupportStack --require-approval never

# Regional
npx aws-cdk@2.x ${command} Platform/ApiStack --require-approval never
npx aws-cdk@2.x ${command} Platform/GraphStack --require-approval never
npx aws-cdk@2.x ${command} Platform/FrontendStack --require-approval never
npx aws-cdk@2.x ${command} Platform/IngestStack --require-approval never
npx aws-cdk@2.x ${command} Platform/DiscoStack --require-approval never
npx aws-cdk@2.x ${command} Platform/NotificationStack --require-approval never

# Edge
npx aws-cdk@2.x ${command} Platform/ApiEdgeStack --require-approval never
npx aws-cdk@2.x ${command} Platform/FrontendEdgeStack --require-approval never
