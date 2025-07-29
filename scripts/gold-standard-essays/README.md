# Gold Standard Essays Structure

Each topic directory contains essays at different score levels:
- `veryhigh.json` (90-95 score)
- `high.json` (85-90 score)
- `medium.json` (75-84 score)
- `low.json` (65-74 score)
- `verylow.json` (50-65 score)

## Essay File Format

```json
{
  "topic": "The exact topic question",
  "essayText": "The complete essay text...",
  "wordCount": 250,
  "officialScore": 88,
  "scoreBreakdown": {
    "content": 85,
    "coherence": 90,
    "vocabulary": 88,
    "grammar": 86
  },
  "strengths": ["Clear thesis", "Good examples"],
  "weaknesses": ["Minor grammar errors"]
}
```

## Adding New Essays

1. Choose the appropriate topic directory
2. Create a file with the score level name (e.g., `high.json`)
3. Follow the format above
4. Run `npm run seed-essays` to load them

The seed script will:
- Automatically generate embeddings
- Assign unique IDs based on topic and score
- Overwrite existing essays with same ID