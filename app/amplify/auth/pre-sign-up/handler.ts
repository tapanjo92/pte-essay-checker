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
    // For MVP: Only handle regular email/password signups
    console.log(`Email/password sign-up for: ${email}`);
    
    // No external provider logic needed for MVP
    // Just allow the signup to proceed normally
    
  } catch (error: any) {
    console.error('Error in pre-sign-up trigger:', error);
    // For errors, allow sign-up to continue
  }

  return event;
};