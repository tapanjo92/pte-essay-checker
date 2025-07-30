import type { PostConfirmationTriggerHandler } from 'aws-lambda';

export const handler: PostConfirmationTriggerHandler = async (event) => {
  console.log('Post-confirmation trigger:', JSON.stringify(event, null, 2));
  
  // Store auth method used for sign-up
  if (event.triggerSource === 'PostConfirmation_ConfirmSignUp') {
    const email = event.request.userAttributes.email;
    const sub = event.request.userAttributes.sub;
    
    console.log(`New user confirmed - Email: ${email}, Sub: ${sub}, Method: Email/Password`);
    
    // You could store this in DynamoDB for tracking
    // For now, we'll just log it
  }
  
  // Handle federated sign-ups (Google, Facebook, etc.)
  if (event.triggerSource === 'PostConfirmation_ConfirmForgotPassword') {
    console.log('Password reset confirmed for:', event.request.userAttributes.email);
  }
  
  // External provider sign-up
  if (event.request.userAttributes.identities) {
    try {
      const identities = JSON.parse(event.request.userAttributes.identities);
      const provider = identities[0]?.providerName;
      console.log(`User signed up via ${provider}:`, event.request.userAttributes.email);
    } catch (error) {
      console.error('Error parsing identities:', error);
    }
  }
  
  return event;
};