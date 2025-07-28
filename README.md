# PTE Essay Checker - Deployment Guide

## 📋 Deployment Steps

### 1. **Deploy Sandbox**

```bash
cd /root/pte-essay-checker/app
npx ampx sandbox --identifier v3  # or any identifier you want
```

Wait for deployment to complete (~10-15 minutes)

### 2. **Get GoldStandardEssay Table Name**
After deployment completes:
```bash
aws dynamodb list-tables --region ap-south-1 | grep GoldStandard
```
Note the table name (e.g., `GoldStandardEssay-abc123xyz-NONE`)

### 3. **Update Seeding Script**
Edit `/root/pte-essay-checker/scripts/seed-complete-essays.js` line 11:
```javascript
const TABLE_NAME = 'GoldStandardEssay-[YOUR-TABLE-SUFFIX]-NONE';
```

### 4. **Seed Gold Standard Essays**
```bash
cd /root/pte-essay-checker/scripts
node seed-complete-essays.js
```

### 5. **Verify Deployment**
Submit a test essay through the web interface and check:
- Essay processing completes
- Vector search finds similar essays
- Scoring includes all PTE criteria
- Results display correctly

## 📊 Gold Standard Essays

Currently seeded with **29 essays** across **19 topics**:
- 6 essays for Space Exploration (various score levels)
- 2 essays each for: Climate Change, Social Media, Online Education, Unpaid Internships, Social Media Influencers
- 1 essay each for: Remote Work, AI Impact, Healthcare, and 11 other topics

## 🚨 Troubleshooting

### Common Issues:

1. **"No gold standard essays found"**
   - Ensure you ran the seed script with correct table name
   - Verify essays were seeded: `aws dynamodb scan --table-name [TABLE_NAME] --select COUNT`

2. **Vector search not working**
   - Check Lambda has correct GOLD_STANDARD_TABLE_NAME
   - Verify Lambda has DynamoDB permissions

3. **Build failures**
   - Ensure `app/package-lock.json` exists
   - Check all Lambda functions have their dependencies

## 🔧 Production Deployment

For production deployment via GitHub:
```bash
git add .
git commit -m "Deploy PTE Essay Checker"
git push origin main
```

Amplify will automatically build and deploy from your GitHub repository.

**✅ Deployment Complete!**