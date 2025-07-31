# Account Linking Improvements

## Current Issues:

1. **Google → Email Sign-up**: Blocked with error (good for preventing duplicates)
2. **Google → Email Sign-in**: Fails silently (bad UX)

## Recommended Solutions:

### Option 1: Better Error Messages in Sign-in Form
```typescript
// In auth-form.tsx sign-in handler
catch (error) {
  if (error.name === 'NotAuthorizedException') {
    // Check if user exists with external provider
    const userExists = await checkUserExistsByEmail(email);
    if (userExists) {
      setError('This account uses Google sign-in. Please click "Continue with Google" instead.');
      return;
    }
  }
}
```

### Option 2: Allow Password Setting for Google Users
Add a "Set Password" feature in user profile for Google users who want email/password access too.

### Option 3: Auto-redirect to Google Sign-in
When email sign-in fails, automatically check if the user has a Google account and prompt them to use Google sign-in.

## Best Practice:
Most apps show which sign-in method was used during account creation:
- "You previously signed in with Google"
- "You previously signed in with email"