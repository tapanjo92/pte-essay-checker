import { InfoIcon } from 'lucide-react';

export function AuthMethodInfo() {
  return (
    <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 mb-6">
      <div className="flex gap-3">
        <InfoIcon className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-200">
          <p className="font-medium mb-2">Account Security Notice</p>
          <ul className="space-y-1 text-blue-100/80">
            <li>• Each email can only be associated with one account</li>
            <li>• If you sign up with Google, always use "Continue with Google" to sign in</li>
            <li>• If you sign up with email/password, use those credentials to sign in</li>
            <li>• Accounts cannot be merged after creation for security reasons</li>
          </ul>
        </div>
      </div>
    </div>
  );
}