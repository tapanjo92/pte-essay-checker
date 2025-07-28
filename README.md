# PTE Essay Checker - Deployment Guide

## 📋 Fresh Deployment Steps

### 1. **Deploy Sandbox**
```bash
cd /root/pte-essay-checker/app
AWS_REGION=ap-south-1 npx ampx sandbox --identifier vector-v3
```
Wait for deployment to complete (~5-6 minutes)

### 2. **Get Table Names**
```bash
aws dynamodb list-tables --region ap-south-1 | grep -E "Essay-|Result-|User-|GoldStandard" | grep -v old
```
Note the new table suffix (e.g., `abc123xyz`)

### 3. **Update Configuration Files**
Edit these files with new table names:
- `/app/amplify/functions/processEssay/resource.ts`
- `/app/amplify/functions/submitEssayToQueue/resource.ts`
- `/app/amplify/functions/generateEmbeddings/resource.ts`

### 4. **Redeploy Sandbox**
```bash
AWS_REGION=ap-south-1 npx ampx sandbox --identifier vector-v3
```

### 5. **Update Seeding Script**
Edit line 11 in `/scripts/seed-complete-essays.js`:
```javascript
const TABLE_NAME = 'GoldStandardEssay-[NEW-SUFFIX]-NONE';
```

### 6. **Seed Gold Standard Essays**
```bash
cd /root/pte-essay-checker/scripts
node seed-complete-essays.js
```

### 7. **Verify Deployment**
Check CloudWatch logs:
```bash
aws logs tail /aws/lambda/[processEssay-function-name] --follow --region ap-south-1
```

### 8. **Test Essay Submission**
Submit a test essay through the UI and verify:
- Vector search is working
- Scoring uses graduated content scoring
- Word count penalties apply

**✅ Deployment Complete!**