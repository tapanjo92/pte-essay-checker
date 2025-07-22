import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
  name: 'pteEssayStorage',
  access: (allow) => ({
    'essays/*': [
      allow.authenticated.to(['read', 'write', 'delete']),
      allow.guest.to(['read'])
    ],
    'results/*': [
      allow.authenticated.to(['read']),
    ],
    'exports/*': [
      allow.authenticated.to(['read', 'write', 'delete']),
    ],
  }),
});