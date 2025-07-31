'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, signUp, confirmSignUp, getCurrentUser } from 'aws-amplify/auth';
import { Button } from '@/components/ui/button';
import { Amplify } from 'aws-amplify';
import amplifyConfig from '@/amplify_outputs.json';
import { usePrefersReducedMotion } from '@/lib/motion-safe';
import { 
  Mail, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  Sparkles, 
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Loader2,
  Zap
} from 'lucide-react';

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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [code, setCode] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  // Add floating animation
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const prefersReducedMotion = usePrefersReducedMotion();
  
  // Check if user is already signed in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Skip auth check if we're in the middle of OAuth flow
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('code') || urlParams.has('state')) {
          console.log('OAuth flow detected in auth-form, skipping auth check');
          return;
        }
        
        await getCurrentUser();
        // User is already signed in, redirect to dashboard
        router.push('/dashboard');
      } catch (error) {
        // User is not signed in, stay on auth page
      }
    };
    checkAuth();
    
    // Check for OAuth errors stored in session storage
    const storedError = sessionStorage.getItem('authError');
    if (storedError) {
      setError(storedError);
      sessionStorage.removeItem('authError');
    }
  }, [router]);
  
  useEffect(() => {
    if (prefersReducedMotion) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [prefersReducedMotion]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('Attempting sign in with email:', email);
      const { isSignedIn } = await signIn({ username: email, password });
      console.log('Sign in successful:', isSignedIn);
      if (isSignedIn) {
        router.push('/dashboard');
      }
    } catch (err: any) {
      console.error('Sign in error:', err);
      const errorMessage = err.message || 'An error occurred during sign in';
      
      // Handle already signed in error
      if (errorMessage.includes('UserAlreadyAuthenticatedException') || errorMessage.includes('already a signed in user')) {
        router.push('/dashboard');
        return;
      }
      
      if (errorMessage.includes('User does not exist')) {
        setError('No account found with this email. Please sign up first.');
      } else if (errorMessage.includes('Incorrect username or password')) {
        setError('Incorrect email or password. If you signed up with Google, please use "Continue with Google" instead.');
      } else if (errorMessage.includes('Please sign in with Google') || errorMessage.includes('social provider')) {
        setError('This account uses Google sign-in. Please click "Continue with Google" below.');
      } else if (errorMessage.includes('Network')) {
        setError('Network error. Please check your connection.');
      } else {
        setError(errorMessage);
      }
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
        sessionStorage.setItem('pendingUserFirstName', firstName);
        sessionStorage.setItem('pendingUserLastName', lastName);
        setMode('confirm');
        setSuccessMessage('Check your email for verification code');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'An error occurred during sign up';
      if (errorMessage.includes('already exists')) {
        setError('An account with this email already exists. Please sign in instead, or use "Continue with Google" if you previously signed up with Google.');
      } else if (errorMessage.includes('sign in with Google')) {
        setError('An account with this email already exists through Google. Please use "Continue with Google" to sign in.');
      } else if (errorMessage.includes('password')) {
        setError('Password must be at least 8 characters and include uppercase, lowercase, numbers, and special characters.');
      } else if (errorMessage.includes('Network')) {
        setError('Network error. Please check your connection.');
      } else {
        setError(errorMessage);
      }
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
        await signIn({ username: email, password });
        router.push('/dashboard');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'An error occurred during confirmation';
      if (errorMessage.includes('Invalid verification code')) {
        setError('Invalid verification code.');
      } else if (errorMessage.includes('expired')) {
        setError('Verification code has expired.');
      } else if (errorMessage.includes('Network')) {
        setError('Network error. Please check your connection.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-purple-950 via-violet-900 to-pink-950 text-white overflow-hidden">
      {/* Animated gradient mesh background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/30 via-purple-500/30 to-pink-500/30" />
        <div 
          className="absolute inset-0 opacity-50"
          style={{
            background: `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(59, 130, 246, 0.15), transparent 50%)`,
          }}
        />
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }} />

        {/* Floating gradient orbs */}
        <div className={`absolute top-20 left-10 w-72 h-72 bg-cyan-400 rounded-full mix-blend-screen filter blur-[128px] opacity-50 ${!prefersReducedMotion && 'animate-float'}`} />
        <div className={`absolute bottom-20 right-10 w-96 h-96 bg-purple-400 rounded-full mix-blend-screen filter blur-[128px] opacity-50 ${!prefersReducedMotion && 'animate-float-delayed'}`} />
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-400 rounded-full mix-blend-screen filter blur-[128px] opacity-50 ${!prefersReducedMotion && 'animate-float-slow'}`} />
      </div>

      {/* Main content */}
      <div className="relative flex min-h-screen">
        {/* Left side - Branding */}
        <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-12">
          <div className="max-w-md space-y-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                PTE Essay Checker
              </span>
            </div>
            
            <div className="space-y-6">
              <h1 className="text-5xl font-bold leading-tight">
                <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Perfect your essays
                </span>
                <br />
                with AI precision
              </h1>
              
              <p className="text-lg text-gray-400">
                Get instant feedback, improve your writing, and achieve your target PTE score with our advanced AI-powered essay checker.
              </p>

              <div className="space-y-4 pt-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <p className="font-semibold">AI-Powered Analysis</p>
                    <p className="text-sm text-gray-500">Advanced feedback in seconds</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <p className="font-semibold">PTE Criteria Focused</p>
                    <p className="text-sm text-gray-500">Aligned with official standards</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-pink-500/10 rounded-lg flex items-center justify-center">
                    <Zap className="w-6 h-6 text-pink-400" />
                  </div>
                  <div>
                    <p className="font-semibold">Instant Results</p>
                    <p className="text-sm text-gray-500">No waiting, immediate insights</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Auth Form */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            <div className="bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-gray-800 p-8 shadow-2xl">
              {/* Header */}
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-2">
                  {mode === 'signin' && 'Welcome back'}
                  {mode === 'signup' && 'Create your account'}
                  {mode === 'confirm' && 'Verify your email'}
                </h2>
                <p className="text-gray-400">
                  {mode === 'signin' && 'Sign in to continue to PTE Essay Checker'}
                  {mode === 'signup' && 'Start improving your essays today'}
                  {mode === 'confirm' && 'Enter the code we sent to your email'}
                </p>
              </div>

              {/* Error/Success Messages */}
              {error && (
                <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}
              
              {successMessage && (
                <div className="mb-6 p-3 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <p className="text-sm text-green-400">{successMessage}</p>
                </div>
              )}


              {/* Form */}
              <form onSubmit={
                mode === 'signin' ? handleSignIn :
                mode === 'signup' ? handleSignUp :
                handleConfirm
              } className="space-y-4">
                
                {mode === 'signup' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">
                        First name
                      </label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full px-3 py-2.5 bg-purple-900/30 border border-purple-500/30 rounded-lg text-white placeholder-purple-300/50 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 focus:outline-none transition-all backdrop-blur-sm"
                        placeholder="John"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">
                        Last name
                      </label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full px-3 py-2.5 bg-purple-900/30 border border-purple-500/30 rounded-lg text-white placeholder-purple-300/50 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 focus:outline-none transition-all backdrop-blur-sm"
                        placeholder="Doe"
                        required
                      />
                    </div>
                  </div>
                )}

                {(mode === 'signin' || mode === 'signup') && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">
                        Email address
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3 py-2.5 bg-purple-900/30 border border-purple-500/30 rounded-lg text-white placeholder-purple-300/50 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 focus:outline-none transition-all backdrop-blur-sm"
                        placeholder="you@example.com"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">
                        Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full px-3 py-2.5 bg-purple-900/30 border border-purple-500/30 rounded-lg text-white placeholder-purple-300/50 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 focus:outline-none transition-all backdrop-blur-sm pr-10"
                          placeholder="••••••••"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {mode === 'signup' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">
                      Confirm password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors pr-10"
                        placeholder="••••••••"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}

                {mode === 'confirm' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">
                      Verification code
                    </label>
                    <input
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      className="w-full px-4 py-3 bg-purple-900/30 border border-purple-500/30 rounded-lg text-white text-center text-xl font-mono placeholder-purple-300/50 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 focus:outline-none transition-all backdrop-blur-sm tracking-widest"
                      placeholder="000000"
                      maxLength={6}
                      required
                    />
                  </div>
                )}

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg shadow-purple-500/25"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Please wait...</span>
                    </div>
                  ) : (
                    <span>
                      {mode === 'signin' ? 'Sign in' :
                       mode === 'signup' ? 'Create account' :
                       'Verify email'}
                    </span>
                  )}
                </Button>

                {/* Alternative actions */}
                <div className="text-center text-sm">
                  {mode === 'signin' && (
                    <>
                      <p className="text-gray-500">
                        New to PTE Essay Checker?{' '}
                        <button
                          type="button"
                          onClick={() => {
                            setMode('signup');
                            setError('');
                            setSuccessMessage('');
                          }}
                          className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                        >
                          Create an account
                        </button>
                      </p>
                    </>
                  )}

                  {mode === 'signup' && (
                    <p className="text-gray-500">
                      Already have an account?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setMode('signin');
                          setError('');
                          setSuccessMessage('');
                        }}
                        className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                      >
                        Sign in
                      </button>
                    </p>
                  )}

                  {mode === 'confirm' && (
                    <p className="text-gray-500">
                      Didn't receive a code?{' '}
                      <button
                        type="button"
                        className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                      >
                        Resend code
                      </button>
                    </p>
                  )}
                </div>
              </form>
            </div>

            {/* Footer */}
            <p className="text-center text-xs text-gray-500 mt-8">
              By continuing, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0);
          }
          33% {
            transform: translateY(-30px) translateX(20px);
          }
          66% {
            transform: translateY(20px) translateX(-20px);
          }
        }
        
        @keyframes float-delayed {
          0%, 100% {
            transform: translateY(0) translateX(0);
          }
          33% {
            transform: translateY(30px) translateX(-30px);
          }
          66% {
            transform: translateY(-20px) translateX(20px);
          }
        }
        
        @keyframes float-slow {
          0%, 100% {
            transform: translateY(0) translateX(0);
          }
          50% {
            transform: translateY(-40px) translateX(-30px);
          }
        }
        
        .animate-float {
          animation: float 20s ease-in-out infinite;
        }
        
        .animate-float-delayed {
          animation: float-delayed 25s ease-in-out infinite;
        }
        
        .animate-float-slow {
          animation: float-slow 30s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}