import type { PostConfirmationTriggerHandler } from 'aws-lambda';
import { 
  CognitoIdentityProviderClient,
  AdminUpdateUserAttributesCommand 
} from '@aws-sdk/client-cognito-identity-provider';

const cognitoClient = new CognitoIdentityProviderClient({});

export const handler: PostConfirmationTriggerHandler = async (event) => {
  console.log('Post-confirmation trigger:', JSON.stringify(event, null, 2));
  
  const { triggerSource, userName, userPoolId, request } = event;
  const { email, sub } = request.userAttributes;
  
  try {
    let authMethod = 'unknown';
    
    // For MVP: All signups are email/password
    if (triggerSource === 'PostConfirmation_ConfirmSignUp') {
      authMethod = 'email';
      console.log(`New user confirmed via email/password - Email: ${email}, Sub: ${sub}`);
    } else if (triggerSource === 'PostConfirmation_ConfirmForgotPassword') {
      // Password reset
      console.log(`Password reset confirmed for: ${email}`);
      return event; // No need to update attributes for password reset
    }
    
    // Store the authentication method as a custom attribute
    // This helps track how users originally signed up
    try {
      const updateCommand = new AdminUpdateUserAttributesCommand({
        UserPoolId: userPoolId,
        Username: userName,
        UserAttributes: [
          {
            Name: 'custom:auth_method',
            Value: authMethod
          },
          {
            Name: 'custom:signup_date',
            Value: new Date().toISOString()
          }
        ]
      });
      
      await cognitoClient.send(updateCommand);
      console.log(`Updated user attributes - auth_method: ${authMethod}`);
    } catch (updateError: any) {
      console.error('Error updating user attributes:', updateError);
      // Don't fail the confirmation if attribute update fails
    }
    
  } catch (error) {
    console.error('Error in post-confirmation:', error);
    // Don't block user confirmation on errors
  }
  
  return event;
};