# PTE Essay Checker - Complete Deployment Guide

## 📋 Prerequisites

- AWS Account with Bedrock access in `ap-south-1`
- Node.js 18+ installed
- AWS CLI configured with credentials
- Google OAuth credentials (Client ID & Secret)

## 🚀 Deployment Steps

### 1. **Set Google OAuth Secrets**

Before deploying, set your Google OAuth credentials:

```bash
cd /root/pte-essay-checker/app

# Set Google Client ID (without http:// prefix!)
printf "YOUR_GOOGLE_CLIENT_ID" | npx ampx sandbox secret set GOOGLE_CLIENT_ID --identifier v3

# Set Google Client Secret
printf "YOUR_GOOGLE_CLIENT_SECRET" | npx ampx sandbox secret set GOOGLE_CLIENT_SECRET --identifier v3
```

**Important**: Use `printf` instead of `echo` to avoid newline characters!

### 2. **Deploy Sandbox**

```bash
# Deploy with a specific identifier
npx ampx sandbox --identifier v3 --once

# Or for continuous development
npx ampx sandbox --identifier v3
```

Wait for deployment to complete (~10-15 minutes). Check status:
```bash
aws cloudformation describe-stacks --stack-name amplify-app-v3-sandbox-* --region ap-south-1 --query 'Stacks[0].StackStatus'
```

### 3. **Update Lambda Environment Variables**

After deployment, the Lambda functions need proper table names:

```bash
# Find the processEssay Lambda
LAMBDA_NAME=$(aws lambda list-functions --region ap-south-1 --query 'Functions[?contains(FunctionName, `v3`) && contains(FunctionName, `processEssay`)].FunctionName' --output text)

# Get table names
ESSAY_TABLE=$(aws dynamodb list-tables --region ap-south-1 | grep -o "Essay-[^,\"]*" | head -1)
RESULT_TABLE=$(aws dynamodb list-tables --region ap-south-1 | grep -o "Result-[^,\"]*" | head -1)
USER_TABLE=$(aws dynamodb list-tables --region ap-south-1 | grep -o "User-[^,\"]*" | head -1)
GOLD_TABLE=$(aws dynamodb list-tables --region ap-south-1 | grep -o "GoldStandardEssay-[^,\"]*" | head -1)

# Update Lambda environment
aws lambda update-function-configuration \
  --function-name $LAMBDA_NAME \
  --region ap-south-1 \
  --environment "Variables={
    ESSAY_TABLE_NAME=$ESSAY_TABLE,
    RESULT_TABLE_NAME=$RESULT_TABLE,
    USER_TABLE_NAME=$USER_TABLE,
    GOLD_STANDARD_TABLE_NAME=$GOLD_TABLE,
    BEDROCK_MODEL_ID=anthropic.claude-3-haiku-20240307-v1:0,
    BEDROCK_REGION=ap-south-1,
    AWS_XRAY_CONTEXT_MISSING=LOG_ERROR,
    AWS_XRAY_TRACING_NAME=PTE-Essay-ProcessEssay,
    APP_URL=https://main.d1hed7gjlm8m1f.amplifyapp.com,
    AMPLIFY_SSM_ENV_CONFIG='{}'
  }"
```

### 4. **Fix Queue Configuration (Important!)**

The submitEssayToQueue Lambda needs the SQS queue URL:

```bash
# Find the submitEssayToQueue Lambda
SUBMIT_LAMBDA=$(aws lambda list-functions --region ap-south-1 --query 'Functions[?contains(FunctionName, `v3`) && contains(FunctionName, `submit`)].FunctionName' --output text)

# Update with the queue URL and table name
aws lambda update-function-configuration \
  --function-name $SUBMIT_LAMBDA \
  --region ap-south-1 \
  --environment "Variables={
    ESSAY_QUEUE_URL=https://sqs.ap-south-1.amazonaws.com/493093635246/essay-local,
    ESSAY_TABLE_NAME=$ESSAY_TABLE,
    AWS_XRAY_CONTEXT_MISSING=LOG_ERROR,
    AWS_XRAY_TRACING_NAME=PTE-Essay-SubmitToQueue
  }"
```

### 5. **Update and Run Seed Script**

Update the seed script with your table name:

```bash
# Get the GoldStandardEssay table name
GOLD_TABLE=$(aws dynamodb list-tables --region ap-south-1 | grep -o "GoldStandardEssay-[^,\"]*" | head -1)
echo "Gold Standard Table: $GOLD_TABLE"

# Update the seed script
cd /root/pte-essay-checker/scripts
sed -i "s/GoldStandardEssay-[^']*/$(echo $GOLD_TABLE | sed 's/[[\.*^$()+?{|]/\\&/g')/" seed-essays-v2.js

# Run the enhanced seed script (with embeddings)
node seed-essays-v2.js
```

### 6. **Generate Amplify Outputs**

Generate the configuration file for the frontend:

```bash
cd /root/pte-essay-checker/app
npx ampx generate outputs --stack amplify-app-v3-sandbox-* --format json --out-dir .
```

### 7. **Build and Run the Application**

```bash
# Install dependencies (if needed)
npm install @aws-sdk/client-cognito-identity-provider

# Build the application
npm run build

# Start the development server
npm run dev
```

## 📊 Current Configuration

### AI Models
- **Primary Model**: Claude 3 Haiku (4 req/min rate limit)
- **Fallback Model**: Claude 3 Sonnet (1 req/min rate limit)
- **Embeddings**: Cohere Embed English v3 (1024 dimensions)

### Gold Standard Essays
- **37 essays** across **17 topics**
- Score ranges: Very Low (50-65), Low (65-74), Medium (75-84), High (85-90), Very High (90-95)
- All essays include embeddings for vector similarity search

## 🔍 Verification Steps

1. **Check Lambda Functions**:
```bash
aws lambda list-functions --region ap-south-1 --query 'Functions[?contains(FunctionName, `v3`)].FunctionName'
```

2. **Verify Table Creation**:
```bash
aws dynamodb list-tables --region ap-south-1 | grep -E "(Essay|Result|User|GoldStandard)"
```

3. **Check Gold Standard Essays**:
```bash
aws dynamodb scan --table-name $GOLD_TABLE --select COUNT --region ap-south-1
```

4. **Test Essay Submission**:
- Navigate to http://localhost:3000
- Sign in (Google OAuth or email)
- Select an essay topic
- Submit an essay
- Check results appear within 30-60 seconds

## 🚨 Troubleshooting

### "Website not loading"
```bash
# Kill existing processes
pkill -f "next|node.*3000"

# Restart server
npm run dev
```

### "Essay stuck in PENDING"
- Check Lambda environment variables are set
- Verify SQS queue URL is configured
- Check CloudWatch logs for errors

### "No gold standard essays found"
- Ensure seed-essays-v2.js has correct table name
- Verify embeddings are being generated
- Check Bedrock model access in ap-south-1

### Build Errors
1. Missing dependencies: `npm install`
2. Type errors: Check recent code changes
3. Auth errors: Verify Google secrets are set correctly

## 🔧 Production Deployment

For production deployment:
```bash
git add .
git commit -m "Deploy PTE Essay Checker with Haiku & Cohere"
git push origin main
```

## 📝 Notes

- The current setup uses a shared SQS queue (`pte-essay-queue-sblocal`) for all sandboxes
- Lambda cold starts are minimized with 1GB memory allocation
- X-Ray tracing is enabled for debugging
- Dead Letter Queue captures failed essay processing attempts

**✅ Deployment Complete!**