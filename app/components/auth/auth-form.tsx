'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, signUp, confirmSignUp } from 'aws-amplify/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Amplify } from 'aws-amplify';
import amplifyConfig from '@/amplify_outputs.json';

// Ensure Amplify is configured
if (!Amplify.getConfig().Auth) {
  Amplify.configure(amplifyConfig);
}

type AuthMode = 'signin' | 'signup' | 'confirm';

export function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>('signin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [code, setCode] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

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
        // Store first and last names in session storage for use after confirmation
        sessionStorage.setItem('pendingUserFirstName', firstName);
        sessionStorage.setItem('pendingUserLastName', lastName);
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


  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>
            {mode === 'signin' && 'Sign In'}
            {mode === 'signup' && 'Create Account'}
            {mode === 'confirm' && 'Confirm Email'}
          </CardTitle>
          <CardDescription>
            {mode === 'signin' && 'Enter your credentials to access your account'}
            {mode === 'signup' && 'Create a new account to start checking essays'}
            {mode === 'confirm' && 'Enter the code sent to your email'}
          </CardDescription>
        </CardHeader>

        <form onSubmit={
          mode === 'signin' ? handleSignIn :
          mode === 'signup' ? handleSignUp :
          handleConfirm
        }>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            
            {successMessage && (
              <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-3 text-sm text-green-600 dark:text-green-400">
                {successMessage}
              </div>
            )}

            {mode === 'signup' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="firstName" className="text-sm font-medium">
                      First Name
                    </label>
                    <input
                      id="firstName"
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      placeholder="John"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="lastName" className="text-sm font-medium">
                      Last Name
                    </label>
                    <input
                      id="lastName"
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      placeholder="Doe"
                      required
                    />
                  </div>
                </div>
              </>
            )}

            {(mode === 'signin' || mode === 'signup') && (
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

            {(mode === 'signin' || mode === 'signup') && (
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  Password
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

            {mode === 'confirm' && (
              <div className="space-y-2">
                <label htmlFor="code" className="text-sm font-medium">
                  Verification Code
                </label>
                <input
                  id="code"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
                  placeholder="123456"
                  maxLength={6}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Enter the 6-digit code sent to your email
                </p>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex flex-col space-y-2">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Loading...' : 
                mode === 'signin' ? 'Sign In' :
                mode === 'signup' ? 'Create Account' :
                'Confirm Email'
              }
            </Button>

            {mode === 'signin' && (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    setMode('signup');
                    setError('');
                    setSuccessMessage('');
                  }}
                >
                  Don't have an account? Sign up
                </Button>
              </>
            )}

            {mode === 'signup' && (
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setMode('signin');
                  setError('');
                  setSuccessMessage('');
                }}
              >
                Already have an account? Sign in
              </Button>
            )}

            {mode === 'confirm' && (
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setMode('signin');
                  setError('');
                  setSuccessMessage('');
                }}
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