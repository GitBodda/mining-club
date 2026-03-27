import { useEffect, useState } from 'react';
import { getRedirectAuthResult, onAuthChange } from '@/lib/firebase';

/**
 * AuthRedirect - Handles Firebase redirect flow after auth
 * This page is shown when Firebase redirects back to the app after authentication
 * It processes the redirect result and returns to the main app
 */
export function AuthRedirect() {
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("Processing authentication...");

  useEffect(() => {
    const handleRedirect = async () => {
      try {
        console.log('[AuthRedirect] Processing Firebase redirect...');
        setStatus("Verifying authentication...");
        
        // Get the redirect result from Firebase
        // This completes the OAuth flow and updates Firebase's internal auth state
        const user = await getRedirectAuthResult();
        
        console.log('[AuthRedirect] Redirect result:', { hasUser: !!user, email: user?.email });
        
        // Set up a listener to detect when auth state changes
        // Firebase updates its state asynchronously, so we need to wait for it
        setStatus("Finalizing authentication...");
        
        const unsubscribe = onAuthChange((updatedUser) => {
          if (updatedUser) {
            console.log('[AuthRedirect] Auth state updated for user:', updatedUser.email);
            unsubscribe();
            
            // Store that we just completed auth
            sessionStorage.setItem('authRedirectComplete', 'true');
            
            // Small delay to ensure state is fully updated
            setTimeout(() => {
              console.log('[AuthRedirect] Redirecting to home...');
              window.location.href = '/';
            }, 500);
          }
        });
        
        // If we got a user directly, also redirect
        if (user) {
          console.log('[AuthRedirect] User returned directly, setting redirect timeout');
          unsubscribe();
          sessionStorage.setItem('authRedirectComplete', 'true');
          setTimeout(() => {
            console.log('[AuthRedirect] Redirecting to home (direct)...');
            window.location.href = '/';
          }, 500);
        }
        
        // Fallback: if nothing happens after 5 seconds, force redirect anyway
        const fallbackTimeout = setTimeout(() => {
          console.warn('[AuthRedirect] Fallback timeout - redirecting anyway');
          unsubscribe();
          window.location.href = '/';
        }, 5000);
        
      } catch (err) {
        console.error('[AuthRedirect] Error processing redirect:', err);
        setError(err instanceof Error ? err.message : 'Error processing authentication');
        setIsProcessing(false);
        
        // Redirect back after 3 seconds
        setTimeout(() => {
          window.location.href = '/';
        }, 3000);
      }
    };

    handleRedirect();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        {isProcessing && !error ? (
          <>
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
            <p className="text-foreground/60">{status}</p>
          </>
        ) : error ? (
          <>
            <p className="text-red-500 font-semibold">Error</p>
            <p className="text-red-500/70 text-sm">{error}</p>
            <p className="text-foreground/60 text-sm">Redirecting back to app...</p>
          </>
        ) : (
          <>
            <p className="text-foreground">Authentication successful!</p>
            <p className="text-foreground/60 text-sm">Redirecting...</p>
          </>
        )}
      </div>
    </div>
  );
}
