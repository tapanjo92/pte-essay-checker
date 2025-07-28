# PTE Essay Checker - Deployment Guide

## 📋 Deployment Steps (Automated Approach)

### 1. **Deploy to AWS Amplify**

#### Option A: Production Deployment (via Git)
```bash
git add .
git commit -m "Deploy PTE Essay Checker"
git push origin main
```

#### Option B: Sandbox Deployment (for testing)
```bash
cd /root/pte-essay-checker/app
AWS_REGION=ap-south-1 npx ampx sandbox --identifier pte-checker
```

Wait for deployment to complete (~5-6 minutes)

### 2. **Update Lambda Environment Variables**
After deployment completes, run the automated script:
```bash
cd /root/pte-essay-checker
chmod +x update-lambda-env.sh
./update-lambda-env.sh
```

This script automatically:
- Fetches the generated table names from CloudFormation
- Updates Lambda function environment variables
- Configures queue URLs

### 3. **Get GoldStandardEssay Table Name**
```bash
aws dynamodb list-tables --region ap-south-1 | grep GoldStandard
```
Note the table name (e.g., `GoldStandardEssay-abc123xyz-NONE`)

### 4. **Update Seeding Script**
Edit `/scripts/seed-complete-essays.js` line 11:
```javascript
const TABLE_NAME = 'GoldStandardEssay-[YOUR-TABLE-SUFFIX]-NONE';
```

### 5. **Seed Gold Standard Essays**
```bash
cd /root/pte-essay-checker/scripts
npm install  # If not already done
node seed-complete-essays.js
```

### 6. **Verify Deployment**
Check CloudWatch logs:
```bash
# Get the actual function name
aws lambda list-functions --region ap-south-1 | grep processEssay

# Then tail the logs
aws logs tail /aws/lambda/[processEssay-function-name] --follow --region ap-south-1
```

### 7. **Test Essay Submission**
1. Open your Amplify app URL
2. Submit a test essay
3. Verify:
   - Essay processing completes
   - Vector search finds similar essays
   - Scoring includes all criteria
   - Results display correctly

## 🔧 Manual Environment Variable Update (if script fails)

If the automated script fails, manually update in AWS Lambda console:

1. **For processEssay function:**
   - `ESSAY_TABLE_NAME`
   - `RESULT_TABLE_NAME`
   - `USER_TABLE_NAME`
   - `GOLD_STANDARD_TABLE_NAME`

2. **For submitEssayToQueue function:**
   - `ESSAY_TABLE_NAME`
   - `ESSAY_QUEUE_URL`

Get these values from:
- DynamoDB console for table names
- SQS console for queue URL

## 🚨 Troubleshooting

### Common Issues:

1. **"Table not found" errors**
   - Run `update-lambda-env.sh` script
   - Check Lambda environment variables

2. **"No gold standard essays" error**
   - Ensure you ran the seed script
   - Verify table name in seed script matches actual table

3. **Build failures**
   - Remove duplicate `amplify.yml` if present
   - Ensure all Lambda functions have `package-lock.json`

4. **Environment variable placeholders**
   - The code now uses empty strings as defaults
   - Script updates them post-deployment

**✅ Deployment Complete!**