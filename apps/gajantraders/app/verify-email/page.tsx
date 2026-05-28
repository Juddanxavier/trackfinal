'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Mail, Plane, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlToken = searchParams.get('token');
  
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [manualMode, setManualMode] = useState(false);

  useEffect(() => {
    // Check for token in URL
    if (urlToken) {
      setToken(urlToken);
      verifyEmail(urlToken);
    } else {
      // Check for stored token from registration
      const storedToken = localStorage.getItem('pendingVerificationToken');
      const storedEmail = localStorage.getItem('pendingVerificationEmail');
      if (storedToken) {
        setToken(storedToken);
        setManualMode(true);
      }
      if (!storedToken && !urlToken) {
        setManualMode(true);
      }
    }
  }, [urlToken]);

  const verifyEmail = async (tokenToVerify: string) => {
    if (!tokenToVerify.trim()) {
      setError('Please enter a verification code');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${API_URL}/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ token: tokenToVerify.trim() }),
      });

      const result = await response.json();
      console.log('Verify email response:', result);

      if (!response.ok) {
        throw new Error(result.message || 'Verification failed');
      }

      // Store auth data
      localStorage.setItem('gt_access_token', result.accessToken);
      localStorage.setItem('user', JSON.stringify(result.user));
      
      // Clear pending verification data
      localStorage.removeItem('pendingVerificationToken');
      localStorage.removeItem('pendingVerificationEmail');
      
      setSuccess(true);
      
      setTimeout(() => {
        router.push('/shipments');
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    verifyEmail(token);
  };

  if (success) {
    return (
      <div className='min-h-screen flex items-center justify-center px-8 py-16' style={{ backgroundColor: '#131818' }}>
        <div className='absolute inset-0 overflow-hidden'>
          <div className='absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl' />
          <div className='absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl' />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className='relative w-full max-w-md'
        >
          <div className='bg-white/[0.03] border border-white/10 backdrop-blur-xl rounded-3xl p-10 shadow-2xl text-center'>
            <div className='w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6'>
              <CheckCircle className='w-8 h-8 text-green-400' />
            </div>
            <h1 className='text-2xl font-bold text-white mb-3'>Email Verified!</h1>
            <p className='text-white/50 mb-6'>
              Redirecting to dashboard...
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  // Manual entry mode (for development or when no URL token)
  if (manualMode) {
    return (
      <div className='min-h-screen flex items-center justify-center px-8 py-16' style={{ backgroundColor: '#131818' }}>
        <div className='absolute inset-0 overflow-hidden'>
          <div className='absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl' />
          <div className='absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl' />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className='relative w-full max-w-md'
        >
          <div className='bg-white/[0.03] border border-white/10 backdrop-blur-xl rounded-3xl p-10 shadow-2xl text-center'>
            <div className='flex items-center justify-center gap-2 mb-6'>
              <div className='w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center'>
                <Plane className='w-5 h-5 text-primary' />
              </div>
              <span className='text-xl font-bold text-white'>Gajan Traders</span>
            </div>
            
            <div className='w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6'>
              <Mail className='w-8 h-8 text-primary' />
            </div>
            
            <h1 className='text-2xl font-bold text-white mb-3'>Verify Your Email</h1>
            <p className='text-white/50 mb-6'>
              Enter the verification code sent to your email
            </p>

            {error && (
              <div className='p-4 bg-red-500/10 border border-red-500/20 rounded-xl mb-4'>
                <p className='text-sm text-red-400'>{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className='space-y-4'>
              <div>
                <input
                  type='text'
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder='Enter verification code'
                  className='w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 text-center font-mono text-lg tracking-wider focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all'
                  required
                />
              </div>

              <button
                type='submit'
                disabled={isLoading}
                className='w-full flex items-center justify-center gap-2 py-3 bg-primary hover:bg-[#172554] text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer'
              >
                {isLoading ? (
                  <div className='w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin' />
                ) : (
                  <>
                    Verify Email
                    <ArrowRight className='w-4 h-4' />
                  </>
                )}
              </button>
            </form>

            <div className='mt-6'>
              <p className='text-sm text-white/50'>
                Didn't receive the code?{' '}
                <button 
                  onClick={() => alert('Resend functionality coming soon!')}
                  className='text-primary hover:text-primary/80 font-medium transition-colors'
                >
                  Resend
                </button>
              </p>
            </div>

            <div className='mt-4'>
              <Link
                href='/login'
                className='text-sm text-white/40 hover:text-white/60 transition-colors'
              >
                Back to Login
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // Auto-verifying from URL token
  return (
    <div className='min-h-screen flex items-center justify-center px-8 py-16' style={{ backgroundColor: '#131818' }}>
      <div className='absolute inset-0 overflow-hidden'>
        <div className='absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl' />
        <div className='absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl' />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className='relative w-full max-w-md'
      >
        <div className='bg-white/[0.03] border border-white/10 backdrop-blur-xl rounded-3xl p-10 shadow-2xl text-center'>
          <div className='flex items-center justify-center gap-2 mb-6'>
            <div className='w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center'>
              <Plane className='w-5 h-5 text-primary' />
            </div>
            <span className='text-xl font-bold text-white'>Gajan Traders</span>
          </div>
          
          <div className='w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6'>
            <Mail className='w-8 h-8 text-primary' />
          </div>
          
          <h1 className='text-2xl font-bold text-white mb-3'>Verifying Email</h1>
          <p className='text-white/50 mb-6'>
            Please wait while we verify your email address...
          </p>

          {error && (
            <div className='p-4 bg-red-500/10 border border-red-500/20 rounded-xl mb-4'>
              <p className='text-sm text-red-400'>{error}</p>
              <button
                onClick={() => setManualMode(true)}
                className='mt-2 text-sm text-primary hover:text-primary/80'
              >
                Enter code manually
              </button>
            </div>
          )}

          {isLoading && (
            <div className='w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto' />
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className='min-h-screen flex items-center justify-center' style={{ backgroundColor: '#131818' }}>
        <div className='w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin' />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
