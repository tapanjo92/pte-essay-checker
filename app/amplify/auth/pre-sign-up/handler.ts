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
    // Check if this is an external provider sign-up (Google)
    if (triggerSource === 'PreSignUp_ExternalProvider') {
      console.log(`External provider sign-up for: ${email}`);
      
      // Validate userName format for Google provider
      if (!userName || !userName.includes('_')) {
        console.warn(`Unexpected userName format for Google provider: ${userName}`);
      }
      
      // Search for existing users with the same email
      const listUsersResponse = await cognitoClient.send(new ListUsersCommand({
        UserPoolId: userPoolId,
        Filter: `email = "${email}"`,
        Limit: 1
      }));

      if (listUsersResponse.Users && listUsersResponse.Users.length > 0) {
        const existingUser = listUsersResponse.Users[0];
        console.log(`Found existing user with email ${email}: ${existingUser.Username}`);

        // Link the external provider to the existing user
        await cognitoClient.send(new AdminLinkProviderForUserCommand({
          UserPoolId: userPoolId,
          DestinationUser: {
            ProviderName: 'Cognito',
            ProviderAttributeValue: existingUser.Username!
          },
          SourceUser: {
            ProviderName: 'Google',
            ProviderAttributeName: 'Cognito_Subject',
            ProviderAttributeValue: userName.split('_')[1] || userName // Fallback to userName if split fails
          }
        }));

        console.log(`Successfully linked Google account to existing user ${existingUser.Username}`);
        
        // Update auth_method attribute
        await cognitoClient.send(new AdminUpdateUserAttributesCommand({
          UserPoolId: userPoolId,
          Username: existingUser.Username!,
          UserAttributes: [
            {
              Name: 'custom:auth_method',
              Value: 'google,email' // Track both methods
            }
          ]
        }));
      } else {
        console.log(`New Google user sign-up for: ${email}`);
        // For new Google users, auto-confirm them
        event.response.autoConfirmUser = true;
        event.response.autoVerifyEmail = true;
      }
    } else {
      // Regular email/password sign-up
      console.log(`Email/password sign-up for: ${email}`);
    }
    
  } catch (error: any) {
    console.error('Error in pre-sign-up trigger:', error);
    // For errors, allow sign-up to continue
  }

  return event;
};