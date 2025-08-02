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
    // Handle different authentication scenarios
    if (triggerSource === 'PreAuthentication_Authentication') {
      // Regular email/password sign-in
      console.log(`Email/password authentication for user: ${userName}`);
      // For MVP: Just allow all email/password authentication
    } else if ((triggerSource as string) === 'PreAuthentication_RefreshToken') {
      // Token refresh - allow it
      console.log(`Token refresh for user: ${userName}`);
    } else {
      console.log(`Unhandled trigger source: ${triggerSource}`);
    }
  } catch (error: any) {
    console.error('Error in pre-authentication:', error);
    // For MVP: Allow authentication to continue on errors
    console.log('Allowing authentication to continue despite error');
  }
  
  return event;
};