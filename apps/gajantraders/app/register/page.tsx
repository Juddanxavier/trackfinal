'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Mail, Lock, Plane, ArrowRight, Eye, EyeOff, Globe, Package, Shield } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function RegisterPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !authLoading && isAuthenticated) {
      setTimeout(() => router.push('/shipments'), 100);
    }
  }, [mounted, authLoading, isAuthenticated, router]);

  if (!mounted || authLoading || isAuthenticated) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-zinc-50'>
        <div className='w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin' />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password.length < 12) {
      setError('Password must be at least 12 characters');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/auth/customer-register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Registration failed');
      }

      if (result.accessToken) {
        localStorage.setItem('gt_access_token', result.accessToken);
        localStorage.setItem('user', JSON.stringify(result.user));
      }

      localStorage.setItem('pendingVerificationEmail', formData.email);

      setSuccessMessage(result.message || 'Registration successful.');
      setTimeout(() => router.push('/onboarding'), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    alert('Google OAuth coming soon!');
  };

  return (
    <div className='min-h-screen flex bg-zinc-50'>
      <div className='hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-primary/5 via-primary/[0.02] to-zinc-50'>
        <div className='absolute top-1/4 left-1/4 w-96 h-96 bg-primary/[0.08] rounded-full blur-3xl' />
        <div className='absolute bottom-1/4 right-1/4 w-64 h-64 bg-blue-500/[0.06] rounded-full blur-3xl' />
        
        <div className='relative z-10 flex flex-col justify-center pl-20 pr-12 py-20'>
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className='flex items-center gap-3 mb-8'
          >
            <div className='w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center'>
              <Plane className='w-8 h-8 text-primary' />
            </div>
            <span className='text-xl font-semibold text-zinc-900 tracking-tight font-heading'>Gajan Traders</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className='text-3xl font-semibold text-zinc-900 mb-4 leading-tight font-heading'
          >
            Start Shipping <span className='text-primary'>Globally Today</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className='text-lg text-zinc-500 mb-10 max-w-md'
          >
            Join thousands of businesses who trust Gajan Traders for their international logistics needs.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className='space-y-4'
          >
            {[
              { icon: Globe, text: '50+ Countries Served' },
              { icon: Package, text: 'Real-time Tracking' },
              { icon: Shield, text: 'Secure Customs Handling' },
            ].map((feature, i) => (
              <div key={i} className='flex items-center gap-3 text-zinc-600'>
                <div className='w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center'>
                  <feature.icon className='w-4 h-4 text-primary' />
                </div>
                <span>{feature.text}</span>
              </div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className='mt-10 grid grid-cols-3 gap-6'
          >
            {[
              { value: '10K+', label: 'Shipments' },
              { value: '99%', label: 'On-Time' },
              { value: '50+', label: 'Countries' },
            ].map((stat, i) => (
              <div key={i} className='text-center'>
                <div className='text-xl font-semibold text-zinc-900'>{stat.value}</div>
                <div className='text-xs text-zinc-400 mt-1'>{stat.label}</div>
              </div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className='mt-10 flex items-center gap-4'
          >
            <div className='flex -space-x-2'>
              {['JD', 'AS', 'RK', 'MK'].map((initials, i) => (
                <div key={i} className='w-8 h-8 rounded-full bg-primary/20 border-2 border-zinc-50 flex items-center justify-center text-xs font-bold text-primary'>
                  {initials}
                </div>
              ))}
            </div>
            <span className='text-sm text-zinc-400'>Join 2000+ happy customers</span>
          </motion.div>
        </div>
      </div>

      <div className='flex-1 flex items-center justify-center px-8 py-16 relative'>
        <div className='absolute inset-0 overflow-hidden lg:hidden'>
          <div className='absolute top-1/4 left-1/4 w-96 h-96 bg-primary/[0.06] rounded-full blur-3xl' />
          <div className='absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/[0.04] rounded-full blur-3xl' />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className='relative w-full max-w-md'
        >
          <div className='lg:hidden flex items-center justify-center gap-2 mb-8'>
            <div className='w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center'>
              <Plane className='w-5 h-5 text-primary' />
            </div>
            <span className='text-lg font-semibold text-zinc-900 font-heading'>Gajan Traders</span>
          </div>

          <div className='bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm'>
            <div className='text-center mb-8'>
              <h1 className='text-xl font-semibold text-zinc-900 font-heading mb-2'>Create Account</h1>
              <p className='text-zinc-500 text-sm'>Start shipping globally with Gajan Traders</p>
            </div>

            {successMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className='mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700'
              >
                <p className="font-medium mb-1">Registration Successful!</p>
                <p>{successMessage}</p>
                <p className="text-xs text-emerald-600/70 mt-2">Redirecting to verification page...</p>
              </motion.div>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className='mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600'
              >
                {error}
              </motion.div>
            )}

            {!successMessage && (
            <form onSubmit={handleSubmit} className='space-y-4'>
              <div>
                <label className='block text-xs font-medium text-zinc-500 mb-1'>Email Address</label>
                <div className='relative'>
                  <Mail className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400' />
                  <input
                    type='email'
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder='you@example.com'
                    className='w-full pl-10 pr-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all'
                    required
                  />
                </div>
              </div>

              <div>
                <label className='block text-xs font-medium text-zinc-500 mb-1'>Password</label>
                <div className='relative'>
                  <Lock className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400' />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder='Min. 12 characters'
                    className='w-full pl-10 pr-10 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all'
                    required
                    minLength={12}
                  />
                  <button
                    type='button'
                    onClick={() => setShowPassword(!showPassword)}
                    className='absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer'
                  >
                    {showPassword ? <EyeOff className='w-4 h-4' /> : <Eye className='w-4 h-4' />}
                  </button>
                </div>
              </div>

              <button
                type='submit'
                disabled={isLoading}
                className='w-full flex items-center justify-center gap-2 py-2.5 bg-primary hover:bg-[#172554] text-white font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer'
              >
                {isLoading ? (
                  <div className='w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin' />
                ) : (
                  <>
                    Create Account
                    <ArrowRight className='w-4 h-4' />
                  </>
                )}
              </button>
            </form>
            )}

            {!successMessage && (
            <>
            <div className='relative my-6'>
              <div className='absolute inset-0 flex items-center'>
                <div className='w-full border-t border-zinc-200' />
              </div>
              <div className='relative flex justify-center text-xs'>
                <span className='px-3 bg-white text-zinc-400'>or continue with</span>
              </div>
            </div>

            <button
              type='button'
              onClick={handleGoogleLogin}
              className='w-full flex items-center justify-center gap-2 py-2.5 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 font-medium rounded-lg transition-all duration-200 cursor-pointer'
            >
              <svg className='w-4 h-4' viewBox='0 0 24 24'>
                <path fill='#4285F4' d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'/>
                <path fill='#34A853' d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'/>
                <path fill='#FBBC05' d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'/>
                <path fill='#EA4335' d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'/>
              </svg>
              Google
            </button>

            <div className='mt-6 text-center'>
              <p className='text-sm text-zinc-500'>
                Already have an account?{' '}
                <Link href='/login' className='text-primary hover:text-primary/80 font-medium transition-colors'>
                  Sign in
                </Link>
              </p>
            </div>
            </>
            )}
          </div>

          <p className='text-center text-xs text-zinc-400 mt-4'>
            By signing up, you agree to our{' '}
            <Link href='/terms' className='text-zinc-500 hover:text-zinc-700 transition-colors'>
              Terms
            </Link>{' '}
            and{' '}
            <Link href='/privacy' className='text-zinc-500 hover:text-zinc-700 transition-colors'>
              Privacy Policy
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
