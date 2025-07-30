import { AlertTriangle, Info } from 'lucide-react';

interface AuthMethodInfoProps {
  email?: string;
  method?: 'password' | 'google' | null;
}

export function AuthMethodInfo({ email, method }: AuthMethodInfoProps) {
  if (!email || !method) return null;

  return (
    <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
      <div className="flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-400 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm text-blue-300 font-medium mb-1">
            Account Information
          </p>
          <p className="text-sm text-gray-300">
            You previously signed up using {method === 'google' ? 'Google' : 'email and password'}.
            Please use the same method to sign in.
          </p>
          {method === 'google' && (
            <p className="text-sm text-gray-400 mt-2">
              Click "Continue with Google" above to sign in.
            </p>
          )}
          {method === 'password' && (
            <p className="text-sm text-gray-400 mt-2">
              Enter your email and password below to sign in.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export function AuthConflictWarning() {
  return (
    <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm text-amber-300 font-medium mb-1">
            Important: One Email, One Method
          </p>
          <p className="text-sm text-gray-300">
            Each email address can only use one sign-in method. If you sign up with email/password, 
            you cannot later sign in with Google using the same email address, and vice versa.
          </p>
          <ul className="text-sm text-gray-400 mt-2 space-y-1">
            <li>• Sign up with email → Always use email/password</li>
            <li>• Sign up with Google → Always use Google</li>
          </ul>
        </div>
      </div>
    </div>
  );
}