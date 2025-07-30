import type { PreAuthenticationTriggerHandler } from 'aws-lambda';

export const handler: PreAuthenticationTriggerHandler = async (event) => {
  console.log('Pre-authentication trigger:', JSON.stringify(event, null, 2));
  
  // Check if this is a federated (OAuth) sign-in attempt
  if (event.triggerSource === 'PreAuthentication_Authentication') {
    const email = event.request.userAttributes?.email?.toLowerCase();
    const identities = event.request.userAttributes?.identities;
    
    if (email && identities) {
      try {
        const identityData = JSON.parse(identities);
        const provider = identityData[0]?.providerName;
        
        if (provider === 'Google') {
          // Check if user is trying to sign in with Google but already has native account
          // In Amplify Gen 2, we handle this more gracefully
          console.log(`Google sign-in attempt for email: ${email}`);
          
          // The actual account linking happens automatically in Cognito
          // We just log for monitoring
        }
      } catch (error) {
        console.error('Error parsing identities:', error);
      }
    }
  }
  
  // For post-confirmation of federated users
  if (event.triggerSource === 'PreAuthentication_Authentication' && 
      event.request.userAttributes?.email) {
    console.log('Authentication attempt for:', event.request.userAttributes.email);
  }
  
  return event;
};