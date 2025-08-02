import { defineAuth, secret } from '@aws-amplify/backend';
import { postConfirmation } from './post-confirmation/resource';
import { preSignUp } from './pre-sign-up/resource';
import { preAuthentication } from './pre-authentication/resource';

/**
 * Define and configure your auth resource
 * @see https://docs.amplify.aws/gen2/build-a-backend/auth
 */
export const auth = defineAuth({
  loginWith: {
    email: true,
    externalProviders: {
      google: {
        clientId: secret('GOOGLE_CLIENT_ID'),
        clientSecret: secret('GOOGLE_CLIENT_SECRET'),
        scopes: ['email', 'profile', 'openid'],
        attributeMapping: {
          email: 'email',
        },
      },
      callbackUrls: [
        'http://localhost:3000',
        'https://main.d1hed7gjlm8m1f.amplifyapp.com',
      ],
      logoutUrls: [
        'http://localhost:3000',
        'https://main.d1hed7gjlm8m1f.amplifyapp.com',
      ],
    },
  },
  userAttributes: {
    email: {
      required: true,
      mutable: true, // Allow OAuth providers to update email
    },
    preferredUsername: {
      mutable: true,
      required: false,
    },
  },
  // Custom attributes to track authentication methods
  customAttributes: {
    auth_method: {
      dataType: 'String',
      mutable: true,
    },
    signup_date: {
      dataType: 'DateTime',
      mutable: false,
    },
  },
  accountRecovery: 'EMAIL_ONLY',
  triggers: {
    postConfirmation,
    preSignUp,
    preAuthentication,
  },
});