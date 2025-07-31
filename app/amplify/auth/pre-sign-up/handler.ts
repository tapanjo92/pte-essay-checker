import type { PreSignUpTriggerHandler } from 'aws-lambda';
import { 
  CognitoIdentityProviderClient, 
  AdminLinkProviderForUserCommand,
  ListUsersCommand,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  AdminUpdateUserAttributesCommand
} from '@aws-sdk/client-cognito-identity-provider';

const cognitoClient = new CognitoIdentityProviderClient({});

export const handler: PreSignUpTriggerHandler = async (event) => {
  console.log('Pre-sign-up trigger:', JSON.stringify(event, null, 2));

  const { triggerSource, userPoolId, userName, request } = event;
  const email = request.userAttributes?.email?.toLowerCase();

  if (!email) {
    return event;
  }

  try {
    // Check if this is a social provider sign-up
    const isExternalProvider = triggerSource === 'PreSignUp_ExternalProvider';
    
    if (isExternalProvider) {
      console.log(`External provider sign-up for email: ${email}`);
      
      // Search for existing users with the same email
      const listUsersCommand = new ListUsersCommand({
        UserPoolId: userPoolId,
        Filter: `email = "${email}"`,
        Limit: 1
      });
      
      const listUsersResponse = await cognitoClient.send(listUsersCommand);
      const existingUsers = listUsersResponse.Users || [];
      
      if (existingUsers.length > 0) {
        const existingUser = existingUsers[0];
        const existingUsername = existingUser.Username;
        
        console.log(`Found existing user ${existingUsername} with email ${email}`);
        
        // Extract provider info from the external provider username
        // Format is usually "Provider_SubjectId" (e.g., "Google_123456789")
        const [providerName, providerUserId] = userName.split('_');
        
        // Link the external provider to the existing user
        const linkCommand = new AdminLinkProviderForUserCommand({
          UserPoolId: userPoolId,
          DestinationUser: {
            ProviderName: 'Cognito',
            ProviderAttributeValue: existingUsername
          },
          SourceUser: {
            ProviderName: providerName,
            ProviderAttributeName: 'Cognito_Subject',
            ProviderAttributeValue: providerUserId
          }
        });
        
        try {
          await cognitoClient.send(linkCommand);
          console.log(`Successfully linked ${providerName} account to existing user ${existingUsername}`);
          
          // Auto-confirm and verify the external provider account
          event.response.autoConfirmUser = true;
          event.response.autoVerifyEmail = true;
          event.response.autoVerifyPhone = true;
          
        } catch (linkError: any) {
          console.error('Error linking accounts:', linkError);
          
          // If linking fails, it might be because the account is already linked
          // or there's a conflict. Allow the sign-up to continue.
          if (linkError.name === 'InvalidParameterException' && 
              linkError.message?.includes('already linked')) {
            console.log('Accounts already linked, proceeding with sign-in');
          } else {
            // For other errors, we might want to prevent sign-up
            throw linkError;
          }
        }
      } else {
        console.log(`No existing user found for ${email}, creating new account`);
        
        // For new users signing up with external provider
        event.response.autoConfirmUser = true;
        event.response.autoVerifyEmail = true;
        event.response.autoVerifyPhone = true;
      }
    } else {
      // For regular (non-external) sign-ups
      console.log(`Regular sign-up for email: ${email}`);
      
      // Check if a user with this email already exists (from external provider)
      const listUsersCommand = new ListUsersCommand({
        UserPoolId: userPoolId,
        Filter: `email = "${email}"`,
        Limit: 5 // Get more results to check all providers
      });
      
      const listUsersResponse = await cognitoClient.send(listUsersCommand);
      const existingUsers = listUsersResponse.Users || [];
      
      // Check if any existing user is from an external provider
      const externalProviderUser = existingUsers.find(user => 
        user.Username?.includes('Google_') || 
        user.Username?.includes('Facebook_') ||
        user.UserAttributes?.some(attr => attr.Name === 'identities')
      );
      
      if (externalProviderUser) {
        // User already exists with external provider
        // Prevent duplicate account creation
        throw new Error(
          'An account with this email already exists. Please sign in with Google instead.'
        );
      }
    }
    
  } catch (error: any) {
    console.error('Error in pre-sign-up trigger:', error);
    
    // Re-throw specific errors to prevent sign-up
    if (error.message?.includes('already exists')) {
      throw error;
    }
    
    // For other errors, log but allow sign-up to continue
    console.error('Allowing sign-up to continue despite error');
  }

  return event;
};