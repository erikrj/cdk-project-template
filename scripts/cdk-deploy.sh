#!/usr/bin/env bash

set -euo pipefail
cd "$(dirname "${0}")/../cdk" || exit 1

command=${1:-deploy}

run() {
  printf '#%.0s' {1..80}
  printf "\ncdk $command $1\n"
  printf '#%.0s' {1..80}
  printf "\n"
  run $1
}

# Global
run Platform/DataStack
run Platform/GraphSupportStack

# Regional
run Platform/ApiStack
run Platform/GraphStack
run Platform/FrontendStack
run Platform/IngestStack
run Platform/DiscoStack
run Platform/NotificationStack

# Edge
run Platform/ApiEdgeStack
run Platform/FrontendEdgeStack
