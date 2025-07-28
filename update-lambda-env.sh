#!/bin/bash

# This script updates Lambda environment variables after Amplify deployment
# Usage: ./update-lambda-env.sh

echo "Updating Lambda environment variables..."

# Get the stack outputs
OUTPUTS=$(aws cloudformation describe-stacks --stack-name amplify-pteessaychecker-main --query 'Stacks[0].Outputs' --region ap-south-1)

# Extract values from outputs
ESSAY_TABLE=$(echo $OUTPUTS | jq -r '.[] | select(.OutputKey=="EssayTableName") | .OutputValue')
RESULT_TABLE=$(echo $OUTPUTS | jq -r '.[] | select(.OutputKey=="ResultTableName") | .OutputValue')
USER_TABLE=$(echo $OUTPUTS | jq -r '.[] | select(.OutputKey=="UserTableName") | .OutputValue')
GOLD_STANDARD_TABLE=$(echo $OUTPUTS | jq -r '.[] | select(.OutputKey=="GoldStandardTableName") | .OutputValue')
ESSAY_QUEUE_URL=$(echo $OUTPUTS | jq -r '.[] | select(.OutputKey=="EssayQueueUrl") | .OutputValue')

# Update processEssay Lambda
aws lambda update-function-configuration \
  --function-name amplify-processEssay \
  --environment Variables="{ESSAY_TABLE_NAME=$ESSAY_TABLE,RESULT_TABLE_NAME=$RESULT_TABLE,USER_TABLE_NAME=$USER_TABLE,GOLD_STANDARD_TABLE_NAME=$GOLD_STANDARD_TABLE,BEDROCK_MODEL_ID=anthropic.claude-3-haiku-20240307-v1:0,BEDROCK_REGION=ap-south-1,AWS_XRAY_CONTEXT_MISSING=LOG_ERROR,AWS_XRAY_TRACING_NAME=PTE-Essay-ProcessEssay}" \
  --region ap-south-1

# Update submitEssayToQueue Lambda
aws lambda update-function-configuration \
  --function-name amplify-submitEssayToQueue \
  --environment Variables="{ESSAY_TABLE_NAME=$ESSAY_TABLE,ESSAY_QUEUE_URL=$ESSAY_QUEUE_URL,AWS_XRAY_CONTEXT_MISSING=LOG_ERROR,AWS_XRAY_TRACING_NAME=PTE-Essay-SubmitToQueue}" \
  --region ap-south-1

echo "Environment variables updated successfully!"