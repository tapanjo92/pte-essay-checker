#!/bin/bash

# This script updates Lambda environment variables after Amplify deployment
# Usage: ./update-lambda-env.sh

echo "Updating Lambda environment variables..."

# Get the correct stack name - Amplify uses a specific naming pattern
STACK_NAME=$(aws cloudformation list-stacks --region ap-south-1 --query "StackSummaries[?contains(StackName,'amplify-pte-essay-checker') && StackStatus=='CREATE_COMPLETE'].StackName" --output text | head -1)

if [ -z "$STACK_NAME" ]; then
    echo "Error: Could not find Amplify stack. Looking for alternative patterns..."
    STACK_NAME=$(aws cloudformation list-stacks --region ap-south-1 --query "StackSummaries[?contains(StackName,'amplify-d2ox51vgulmoy9') && StackStatus=='CREATE_COMPLETE'].StackName" --output text | head -1)
fi

if [ -z "$STACK_NAME" ]; then
    echo "Error: No Amplify stack found. Please deploy first."
    exit 1
fi

echo "Using stack: $STACK_NAME"

# Get the DynamoDB table names
ESSAY_TABLE=$(aws dynamodb list-tables --region ap-south-1 | jq -r '.TableNames[] | select(contains("Essay") and contains("-NONE") and (contains("Essay") | not))')
RESULT_TABLE=$(aws dynamodb list-tables --region ap-south-1 | jq -r '.TableNames[] | select(contains("Result") and contains("-NONE"))')
USER_TABLE=$(aws dynamodb list-tables --region ap-south-1 | jq -r '.TableNames[] | select(contains("User") and contains("-NONE"))')
GOLD_STANDARD_TABLE=$(aws dynamodb list-tables --region ap-south-1 | jq -r '.TableNames[] | select(contains("GoldStandardEssay") and contains("-NONE"))')

# Get the SQS queue URL
ESSAY_QUEUE_URL=$(aws sqs list-queues --region ap-south-1 | jq -r '.QueueUrls[] | select(contains("pte-essay-queue"))')

echo "Found tables:"
echo "  Essay: $ESSAY_TABLE"
echo "  Result: $RESULT_TABLE"
echo "  User: $USER_TABLE"
echo "  GoldStandard: $GOLD_STANDARD_TABLE"
echo "  Queue: $ESSAY_QUEUE_URL"

# Find Lambda function names
PROCESS_LAMBDA=$(aws lambda list-functions --region ap-south-1 | jq -r '.Functions[] | select(.FunctionName | contains("processEssay")) | .FunctionName')
SUBMIT_LAMBDA=$(aws lambda list-functions --region ap-south-1 | jq -r '.Functions[] | select(.FunctionName | contains("submitEssayToQueue")) | .FunctionName')

echo "Found Lambda functions:"
echo "  Process: $PROCESS_LAMBDA"
echo "  Submit: $SUBMIT_LAMBDA"

if [ ! -z "$PROCESS_LAMBDA" ]; then
    # Update processEssay Lambda
    aws lambda update-function-configuration \
      --function-name "$PROCESS_LAMBDA" \
      --environment Variables="{ESSAY_TABLE_NAME=$ESSAY_TABLE,RESULT_TABLE_NAME=$RESULT_TABLE,USER_TABLE_NAME=$USER_TABLE,GOLD_STANDARD_TABLE_NAME=$GOLD_STANDARD_TABLE,BEDROCK_MODEL_ID=anthropic.claude-3-haiku-20240307-v1:0,BEDROCK_REGION=ap-south-1,AWS_XRAY_CONTEXT_MISSING=LOG_ERROR,AWS_XRAY_TRACING_NAME=PTE-Essay-ProcessEssay,APP_URL=https://d1fy4vmul220a2.amplifyapp.com}" \
      --region ap-south-1
fi

if [ ! -z "$SUBMIT_LAMBDA" ]; then
    # Update submitEssayToQueue Lambda
    aws lambda update-function-configuration \
      --function-name "$SUBMIT_LAMBDA" \
      --environment Variables="{ESSAY_TABLE_NAME=$ESSAY_TABLE,ESSAY_QUEUE_URL=$ESSAY_QUEUE_URL,AWS_XRAY_CONTEXT_MISSING=LOG_ERROR,AWS_XRAY_TRACING_NAME=PTE-Essay-SubmitToQueue}" \
      --region ap-south-1
fi

echo "Environment variables updated successfully!"