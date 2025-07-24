import { createTracedClient } from './xray-client';

const client = createTracedClient();

export async function initializeUserIfNeeded(userId: string, email: string, firstName?: string, lastName?: string) {
  console.log('Initializing user:', { userId, email, firstName, lastName });
  
  // First, always try to find existing user
  try {
    // Try listing users - this usually works even with auth issues
    const existingUsers = await client.models.User.list({
      filter: { id: { eq: userId } }
    });
    
    if (existingUsers.data && existingUsers.data.length > 0) {
      console.log('User already exists:', existingUsers.data[0]);
      return existingUsers.data[0];
    }
  } catch (listError) {
    console.log('Error checking for existing user:', listError);
    
    // If it's an auth error, try to get the user directly
    try {
      const directUser = await client.models.User.get({ id: userId });
      if (directUser.data) {
        console.log('Found user via direct get:', directUser.data);
        return directUser.data;
      }
    } catch (directError) {
      console.log('Direct user get also failed:', directError);
    }
  }

  // User doesn't exist, create new user with subscription
  try {
    // Create subscription first
    const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    const subscriptionResult = await client.models.UserSubscription.create({
      plan: 'FREE',
      status: 'ACTIVE',
      essaysRemaining: 5,
      essaysLimit: 5,
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
    });

    if (!subscriptionResult.data) {
      console.error('Failed to create subscription:', subscriptionResult.errors);
      throw new Error('Failed to create subscription');
    }

    console.log('Created subscription:', subscriptionResult.data.id);

    // Create user with subscription
    const userData = {
      id: userId,
      email: email,
      username: email.split('@')[0],
      firstName: firstName || null,
      lastName: lastName || null,
      subscriptionId: subscriptionResult.data.id,
    };
    
    console.log('Creating user with data:', userData);
    const userResult = await client.models.User.create(userData);

    if (userResult.data) {
      console.log('Successfully created user:', userResult.data);
      return userResult.data;
    }

    // If user creation failed, it might already exist
    if (userResult.errors?.some(e => 
      e.message?.includes('ConditionalCheckFailedException') || 
      e.errorType?.includes('ConditionalCheckFailedException') ||
      e.message?.includes('conditional request failed')
    )) {
      console.log('User already exists (conditional check failed), this is OK!');
      
      // Clean up the orphaned subscription we just created
      try {
        await client.models.UserSubscription.delete({ id: subscriptionResult.data.id });
        console.log('Cleaned up orphaned subscription');
      } catch (e) {
        console.log('Failed to clean up subscription:', e);
      }
      
      // Try to fetch the existing user one more time
      try {
        const existingUsers = await client.models.User.list({
          filter: { id: { eq: userId } }
        });
        
        if (existingUsers.data && existingUsers.data.length > 0) {
          console.log('Found existing user after creation failure');
          return existingUsers.data[0];
        }
      } catch (e) {
        console.log('Could not fetch user after creation failure, but user exists');
      }
      
      // Even if we can't fetch the user, we know it exists (ConditionalCheckFailed proves it)
      // Return a minimal user object so the app can continue
      console.log('Returning minimal user object since user exists but cannot be fetched');
      return {
        id: userId,
        email: email,
        username: email.split('@')[0],
        firstName: firstName || null,
        lastName: lastName || null,
        owner: userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } as any;
    }

    // Only throw if it's not a ConditionalCheckFailedException
    console.error('User creation failed with errors:', userResult.errors);
    throw new Error(`Failed to create user: ${JSON.stringify(userResult.errors)}`);
    
  } catch (error) {
    console.error('Error in user initialization:', error);
    
    // As a last resort, try to find the user one more time
    try {
      const lastCheck = await client.models.User.list({
        filter: { id: { eq: userId } }
      });
      
      if (lastCheck.data && lastCheck.data.length > 0) {
        console.log('Found user in final check');
        return lastCheck.data[0];
      }
    } catch (finalError) {
      console.error('Final user check failed:', finalError);
    }
    
    throw error;
  }
}