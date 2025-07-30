import type { PreAuthenticationTriggerHandler } from 'aws-lambda';
import { AdminGetUserCommand, CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';

const cognitoClient = new CognitoIdentityProviderClient({});

export const handler: PreAuthenticationTriggerHandler = async (event) => {
  // Only check for federated (OAuth) sign-ins
  if (event.triggerSource === 'PreAuthentication_Authentication' && 
      event.request.userAttributes.email && 
      event.request.userAttributes.identities) {
    
    const email = event.request.userAttributes.email.toLowerCase();
    const federatedProvider = JSON.parse(event.request.userAttributes.identities)[0]?.providerName;
    
    if (federatedProvider) {
      try {
        // Check if a native Cognito user exists with this email
        const getUserCommand = new AdminGetUserCommand({
          UserPoolId: event.userPoolId,
          Username: email
        });
        
        const existingUser = await cognitoClient.send(getUserCommand);
        
        // If user exists and doesn't have the same provider, it's a conflict
        if (existingUser && !existingUser.UserAttributes?.find(
          attr => attr.Name === 'identities' && attr.Value?.includes(federatedProvider)
        )) {
          // User exists with different auth method
          throw new Error(`ACCOUNT_EXISTS_WITH_DIFFERENT_METHOD:An account with ${email} already exists. Please sign in using your password.`);
        }
      } catch (error: any) {
        if (error.name === 'UserNotFoundException') {
          // No conflict, user doesn't exist
          return event;
        }
        // Re-throw our custom error or any other errors
        throw error;
      }
    }
  }
  
  return event;
};