# Vector Search Implementation for PTE Essay Checker

## Overview
This implementation adds semantic vector search capabilities to the PTE Essay Checker using Amazon Bedrock Titan Embeddings. The system automatically seeds gold standard essays with embeddings and uses cosine similarity for finding relevant examples during essay scoring.

## Architecture

### Components
1. **generateEmbeddings Lambda Function**: Seeds and maintains embeddings for gold standard essays
2. **vectorUtils.ts**: Core vector operations (embedding generation, similarity search)
3. **Enhanced RAG in processEssay**: Uses vector similarity for better essay matching

### Automated Deployment Process
1. Deploy with `npx ampx sandbox` or push to main branch
2. The `generateEmbeddings` function is deployed with proper permissions
3. Post-deployment: Run `npm run post-deploy` to seed essays with embeddings
4. Vector search is now active for all new essay submissions

## Features

### 1. Automatic Seeding
The system includes 5 PTE-standard essays across different score ranges:
- **85-90 (High)**: Sophisticated vocabulary, complex structures
- **75-84 (Medium)**: Good structure, some repetition
- **65-74 (Low)**: Basic structure, grammar errors
- **25-64 (Very Low)**: Poor structure, many errors

### 2. Vector Generation
- Uses Amazon Titan Embed Text V2 (1024 dimensions)
- Combines topic + essay content for context-aware embeddings
- Caches embeddings to reduce API calls
- Rate limiting: 1 second between embedding generations

### 3. Similarity Search
- Cosine similarity with 0.7 threshold (70% similarity)
- Returns top 5 most similar essays
- Falls back to topic-based search if vector search fails
- Results include similarity scores for transparency

## Manual Invocation (if needed)

To manually trigger seeding:
```bash
aws lambda invoke \
  --function-name amplify-pteessaychecker-generateEmbeddings \
  --payload '{"action": "seed"}' \
  response.json
```

To update embeddings for existing essays:
```bash
aws lambda invoke \
  --function-name amplify-pteessaychecker-generateEmbeddings \
  --payload '{"action": "update-existing"}' \
  response.json
```

## Monitoring

Check CloudWatch logs:
```bash
aws logs tail /aws/lambda/amplify-pteessaychecker-generateEmbeddings --follow
```

## Benefits
1. **Better Scoring Accuracy**: Finds semantically similar essays, not just topic matches
2. **Nuanced Feedback**: References essays with similar writing patterns
3. **Scalable**: Can handle thousands of gold standard essays
4. **Automated**: No manual intervention needed after deployment

## Future Enhancements
1. Add more diverse gold standard essays (target: 50+ per topic)
2. Implement vector database (OpenSearch/Pinecone) for better performance
3. Fine-tune similarity thresholds based on scoring accuracy
4. Add A/B testing to compare vector vs non-vector scoring