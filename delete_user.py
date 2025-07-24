#!/usr/bin/env python3
"""
Delete user data from DynamoDB tables for testing purposes.
This script removes user records from User and UserSubscription tables.
"""

import boto3
import sys
from botocore.exceptions import ClientError

# Configure AWS region - same as your Amplify app
REGION = 'ap-south-1'

# Initialize DynamoDB client
dynamodb = boto3.client('dynamodb', region_name=REGION)

def find_and_delete_user(user_id):
    """Find and delete user from User table and associated subscription"""
    
    # Table names - these should match your Amplify-generated table names
    # You may need to update these based on your actual table names
    user_table = None
    subscription_table = None
    
    # List all tables to find the correct ones
    print("Finding DynamoDB tables...")
    tables = dynamodb.list_tables()['TableNames']
    
    for table in tables:
        if 'User' in table and 'UserSubscription' not in table:
            user_table = table
        elif 'UserSubscription' in table:
            subscription_table = table
    
    if not user_table:
        print("Error: Could not find User table")
        return False
        
    print(f"Found User table: {user_table}")
    print(f"Found UserSubscription table: {subscription_table}")
    
    try:
        # First, get the user to find their subscription ID
        print(f"\nLooking for user {user_id}...")
        response = dynamodb.get_item(
            TableName=user_table,
            Key={'id': {'S': user_id}}
        )
        
        if 'Item' not in response:
            print(f"User {user_id} not found in User table")
            return False
            
        user_item = response['Item']
        print(f"Found user: {user_item.get('email', {}).get('S', 'N/A')}")
        
        # Get subscription ID if exists
        subscription_id = user_item.get('subscriptionId', {}).get('S')
        
        # Delete the user
        print(f"Deleting user {user_id}...")
        dynamodb.delete_item(
            TableName=user_table,
            Key={'id': {'S': user_id}}
        )
        print("✓ User deleted successfully")
        
        # Delete subscription if exists
        if subscription_id and subscription_table:
            print(f"\nDeleting subscription {subscription_id}...")
            try:
                dynamodb.delete_item(
                    TableName=subscription_table,
                    Key={'id': {'S': subscription_id}}
                )
                print("✓ Subscription deleted successfully")
            except ClientError as e:
                print(f"Warning: Could not delete subscription: {e}")
        
        # Also check for any essays by this user
        essay_table = None
        for table in tables:
            if 'Essay' in table and 'Result' not in table:
                essay_table = table
                break
                
        if essay_table:
            print(f"\nChecking for essays by user...")
            # Note: This is a scan operation - not efficient for large tables
            # In production, you'd use a GSI on userId
            response = dynamodb.scan(
                TableName=essay_table,
                FilterExpression='userId = :uid',
                ExpressionAttributeValues={':uid': {'S': user_id}}
            )
            
            essays = response.get('Items', [])
            if essays:
                print(f"Found {len(essays)} essays by this user")
                for essay in essays:
                    essay_id = essay['id']['S']
                    dynamodb.delete_item(
                        TableName=essay_table,
                        Key={'id': {'S': essay_id}}
                    )
                print(f"✓ Deleted {len(essays)} essays")
            else:
                print("No essays found for this user")
        
        return True
        
    except ClientError as e:
        print(f"Error: {e}")
        return False

def main():
    print("DynamoDB User Cleanup Script")
    print("=" * 40)
    print("WARNING: This will permanently delete user data!")
    print("Use this only for testing purposes.")
    print("=" * 40)
    
    # Get user ID from command line or prompt
    if len(sys.argv) > 1:
        user_id = sys.argv[1]
    else:
        user_id = input("\nEnter user ID to delete (e.g., 71d35daa-d0c1-7001-6b17-c0b2e8c68f1a): ").strip()
    
    if not user_id:
        print("No user ID provided. Exiting.")
        return
    
    # Confirm deletion
    confirm = input(f"\nAre you sure you want to delete user {user_id}? (yes/no): ").strip().lower()
    
    if confirm != 'yes':
        print("Deletion cancelled.")
        return
    
    # Delete the user
    if find_and_delete_user(user_id):
        print("\n✓ User cleanup completed successfully!")
    else:
        print("\n✗ User cleanup failed or user not found.")

if __name__ == "__main__":
    main()