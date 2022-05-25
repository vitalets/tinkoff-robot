#!/bin/bash
# Deploy as serverless function.

# Exit on any error
set -euo pipefail

check_uncommitted_changes() {
  if [ "$(git status --porcelain)" != "" ]; then
    echo "Git tree in dirty. Please commit changes first."
    exit 1
  fi
}

update_latest_tag() {
  TAG=latest
  if git rev-list -n 1 tags/$TAG >/dev/null 2>&1; then
    curCommit=$(git rev-list -n 1 tags/$TAG)
    git tag -f $TAG-1 $curCommit
  fi
  git tag -f $TAG
}

check_uncommitted_changes
npm run lint
npm test
npm run build
npx deploy-fn
update_latest_tag

echo "Done."
