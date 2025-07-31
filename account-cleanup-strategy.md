# Account Cleanup Strategy for PTE Essay Checker

## Current Duplicate Account Issue

**Email**: `tapan.mjo92@gmail.com`
- **Native Account**: `31a35d1a-9061-7028-9315-4a42e214aae6` (can use email/password)
- **Google Account**: `google_111314170537540086197` (can use Google OAuth)

## Options for Resolution

### Option 1: Delete Native Account (Recommended)
```bash
# Since Google account was created first, keep it as primary
aws cognito-idp admin-delete-user \
  --user-pool-id ap-south-1_3nYVOusBT \
  --username "31a35d1a-9061-7028-9315-4a42e214aae6" \
  --region ap-south-1
```

### Option 2: Delete Google Account
```bash
# If you prefer email/password login
aws cognito-idp admin-delete-user \
  --user-pool-id ap-south-1_3nYVOusBT \
  --username "google_111314170537540086197" \
  --region ap-south-1
```

### Option 3: Data Migration Approach
1. Export data from one account
2. Import to the other
3. Delete the source account
4. Update user preferences

## Future Prevention
- Fixed Lambda triggers will prevent this issue
- Deploy updated pre-sign-up handler
- Monitor CloudWatch logs for proper blocking

## Testing Plan
1. Deploy Lambda fixes
2. Clean up duplicate accounts
3. Test with new test email
4. Verify blocking works correctly