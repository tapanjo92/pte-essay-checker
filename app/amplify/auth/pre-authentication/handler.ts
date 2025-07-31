import type { PreAuthenticationTriggerHandler } from 'aws-lambda';
import { 
  CognitoIdentityProviderClient, 
  AdminUpdateUserAttributesCommand,
  ListUsersCommand 
} from '@aws-sdk/client-cognito-identity-provider';

const cognitoClient = new CognitoIdentityProviderClient({});

export const handler: PreAuthenticationTriggerHandler = async (event) => {
  console.log('Pre-authentication trigger:', JSON.stringify(event, null, 2));
  
  const { triggerSource, userName, userPoolId, request } = event;
  const email = request.userAttributes?.email?.toLowerCase();
  
  try {
    switch (triggerSource) {
      case 'PreAuthentication_Authentication':
        // Regular sign-in attempt
        console.log(`Authentication attempt for user: ${userName}`);
        
        // Check if this is an email/password user trying to sign in
        // but they originally signed up with a social provider
        if (email && !userName?.includes('_')) {
          // This looks like a Cognito native user (not federated)
          // Check if there's a federated account with same email
          const listUsersCommand = new ListUsersCommand({
            UserPoolId: userPoolId,
            Filter: `email = "${email}"`,
            Limit: 5
          });
          
          const listUsersResponse = await cognitoClient.send(listUsersCommand);
          const users = listUsersResponse.Users || [];
          
          // Check if any user is from external provider
          const federatedUser = users.find(user => 
            user.Username?.includes('Google_') || 
            user.Username?.includes('Facebook_') ||
            user.UserAttributes?.some(attr => attr.Name === 'identities')
          );
          
          if (federatedUser && !users.some(u => u.Username === userName)) {
            // User is trying email/password but only has social login
            console.log(`User ${email} should use social login instead`);
            throw new Error('Please sign in with Google or the social provider you used to create your account.');
          }
        }
        
        // For federated users signing in
        if (userName?.includes('_')) {
          console.log(`Federated login for ${userName}`);
          // Auto-confirm federated users (shouldn't need this here, but just in case)
          event.response.autoConfirmUser = true;
          event.response.autoVerifyEmail = true;
        }
        break;
        
      case 'PreAuthentication_RefreshToken':
        // Token refresh - allow it
        console.log(`Token refresh for user: ${userName}`);
        break;
        
      default:
        console.log(`Unhandled trigger source: ${triggerSource}`);
    }
  } catch (error: any) {
    console.error('Error in pre-authentication:', error);
    
    // Re-throw specific errors to block authentication with helpful messages
    if (error.message?.includes('Please sign in with')) {
      throw error;
    }
    
    // For other errors, allow authentication to continue
    console.log('Allowing authentication to continue despite error');
  }
  
  return event;
};