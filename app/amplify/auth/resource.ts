import { defineAuth, secret } from '@aws-amplify/backend';
import { postConfirmation } from './post-confirmation/resource';
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
      },
      callbackUrls: [
        'http://localhost:3000/'
      ],
      logoutUrls: [
        'http://localhost:3000/'
      ],
    },
  },
  userAttributes: {
    email: {
      required: true,
      mutable: false, // Prevent email changes to avoid account conflicts
    },
    preferredUsername: {
      mutable: true,
      required: false,
    },
  },
  accountRecovery: 'EMAIL_ONLY',
  triggers: {
    postConfirmation,
    preAuthentication,
  },
});