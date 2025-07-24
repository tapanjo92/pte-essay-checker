#!/bin/bash
cd /root/pte-essay-checker/app

echo "Deploying Amplify backend with updated schema..."

# Deploy to sandbox
npx ampx sandbox --once

echo "Schema deployment complete!"