import type { PreAuthenticationTriggerHandler } from 'aws-lambda';
import { CognitoIdentityProviderClient, AdminGetUserCommand, ListUsersCommand } from '@aws-sdk/client-cognito-identity-provider';

const cognitoClient = new CognitoIdentityProviderClient({});

export const handler: PreAuthenticationTriggerHandler = async (event) => {
  console.log('Pre-authentication trigger:', JSON.stringify(event, null, 2));
  
  // Handle account linking for users with same email
  if (event.triggerSource === 'PreAuthentication_Authentication') {
    const email = event.request.userAttributes?.email?.toLowerCase();
    const currentUsername = event.userName;
    const userPoolId = event.userPoolId;
    
    if (!email) {
      return event;
    }

    try {
      // Check if this is a federated login
      const isFederatedLogin = currentUsername.includes('Google_') || 
                              currentUsername.includes('Facebook_') ||
                              event.request.userAttributes?.identities;

      if (isFederatedLogin) {
        // Search for existing users with the same email
        const listUsersResponse = await cognitoClient.send(new ListUsersCommand({
          UserPoolId: userPoolId,
          Filter: `email = "${email}"`,
          Limit: 2
        }));

        if (listUsersResponse.Users && listUsersResponse.Users.length > 1) {
          // Multiple accounts with same email exist
          const nativeUser = listUsersResponse.Users.find(u => 
            !u.Username?.includes('Google_') && 
            !u.Username?.includes('Facebook_')
          );

          if (nativeUser) {
            console.log(`Linking federated account to existing native account for email: ${email}`);
            
            // Auto-link accounts by allowing sign-in
            // The post-confirmation trigger will handle merging user data
            event.response.autoConfirmUser = true;
            event.response.autoVerifyEmail = true;
          }
        }
      } else {
        // This is a native login attempt
        // Check if a federated account exists with this email
        const listUsersResponse = await cognitoClient.send(new ListUsersCommand({
          UserPoolId: userPoolId,
          Filter: `email = "${email}"`,
          Limit: 5
        }));

        if (listUsersResponse.Users && listUsersResponse.Users.length > 0) {
          const federatedUser = listUsersResponse.Users.find(u => 
            u.Username?.includes('Google_') || 
            u.Username?.includes('Facebook_')
          );

          if (federatedUser && !listUsersResponse.Users.find(u => u.Username === currentUsername)) {
            // User has a federated account but trying to create native account
            console.warn(`User with email ${email} already exists with federated login`);
            
            // Note: We can't throw an error here as it would block legitimate logins
            // The signup process will handle the UsernameExistsException
          }
        }
      }
    } catch (error) {
      console.error('Error in pre-authentication:', error);
      // Don't block authentication on errors
    }
  }
  
  return event;
};