'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, signUp, confirmSignUp, resetPassword, confirmResetPassword } from 'aws-amplify/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Amplify } from 'aws-amplify';
import amplifyConfig from '@/amplify_outputs.json';

// Ensure Amplify is configured
if (!Amplify.getConfig().Auth) {
  Amplify.configure(amplifyConfig);
}

type AuthMode = 'signin' | 'signup' | 'confirm' | 'reset' | 'reset-confirm';

export function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>('signin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [code, setCode] = useState('');

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { isSignedIn } = await signIn({ username: email, password });
      if (isSignedIn) {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { isSignUpComplete, nextStep } = await signUp({
        username: email,
        password,
        options: {
          userAttributes: {
            email,
          },
        },
      });

      if (!isSignUpComplete && nextStep.signUpStep === 'CONFIRM_SIGN_UP') {
        setMode('confirm');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during sign up');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { isSignUpComplete } = await confirmSignUp({
        username: email,
        confirmationCode: code,
      });

      if (isSignUpComplete) {
        // Sign in automatically after confirmation
        await signIn({ username: email, password });
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during confirmation');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const output = await resetPassword({ username: email });
      const { nextStep } = output;
      
      if (nextStep.resetPasswordStep === 'CONFIRM_RESET_PASSWORD_WITH_CODE') {
        setMode('reset-confirm');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during password reset');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await confirmResetPassword({
        username: email,
        confirmationCode: code,
        newPassword: password,
      });
      setMode('signin');
      setError('Password reset successfully. Please sign in.');
    } catch (err: any) {
      setError(err.message || 'An error occurred during password reset confirmation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>
            {mode === 'signin' && 'Sign In'}
            {mode === 'signup' && 'Create Account'}
            {mode === 'confirm' && 'Confirm Email'}
            {mode === 'reset' && 'Reset Password'}
            {mode === 'reset-confirm' && 'Set New Password'}
          </CardTitle>
          <CardDescription>
            {mode === 'signin' && 'Enter your credentials to access your account'}
            {mode === 'signup' && 'Create a new account to start checking essays'}
            {mode === 'confirm' && 'Enter the code sent to your email'}
            {mode === 'reset' && 'Enter your email to receive a reset code'}
            {mode === 'reset-confirm' && 'Enter the code and your new password'}
          </CardDescription>
        </CardHeader>

        <form onSubmit={
          mode === 'signin' ? handleSignIn :
          mode === 'signup' ? handleSignUp :
          mode === 'confirm' ? handleConfirm :
          mode === 'reset' ? handleResetPassword :
          handleConfirmReset
        }>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {(mode === 'signin' || mode === 'signup' || mode === 'reset') && (
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="you@example.com"
                  required
                />
              </div>
            )}

            {(mode === 'signin' || mode === 'signup' || mode === 'reset-confirm') && (
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  {mode === 'reset-confirm' ? 'New Password' : 'Password'}
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="••••••••"
                  required
                />
              </div>
            )}

            {mode === 'signup' && (
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="••••••••"
                  required
                />
              </div>
            )}

            {(mode === 'confirm' || mode === 'reset-confirm') && (
              <div className="space-y-2">
                <label htmlFor="code" className="text-sm font-medium">
                  Confirmation Code
                </label>
                <input
                  id="code"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="123456"
                  required
                />
              </div>
            )}
          </CardContent>

          <CardFooter className="flex flex-col space-y-2">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Loading...' : 
                mode === 'signin' ? 'Sign In' :
                mode === 'signup' ? 'Create Account' :
                mode === 'confirm' ? 'Confirm Email' :
                mode === 'reset' ? 'Send Reset Code' :
                'Reset Password'
              }
            </Button>

            {mode === 'signin' && (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setMode('signup')}
                >
                  Don't have an account? Sign up
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-sm"
                  onClick={() => setMode('reset')}
                >
                  Forgot password?
                </Button>
              </>
            )}

            {mode === 'signup' && (
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => setMode('signin')}
              >
                Already have an account? Sign in
              </Button>
            )}

            {(mode === 'confirm' || mode === 'reset' || mode === 'reset-confirm') && (
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => setMode('signin')}
              >
                Back to Sign In
              </Button>
            )}
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}