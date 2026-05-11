'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Mail, Lock, Plane, ArrowRight, Eye, EyeOff, Globe, Package, Shield } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Handle client-side only mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect to shipments if already logged in (on initial load)
  useEffect(() => {
    if (mounted && !authLoading && isAuthenticated && !isRedirecting) {
      console.log('[Login] Already authenticated, redirecting to shipments');
      setIsRedirecting(true);
      // Use Next.js router for client-side navigation
      setTimeout(() => {
        router.push('/shipments');
      }, 100);
    }
  }, [mounted, authLoading, isAuthenticated, router, isRedirecting]);

  // Show loading while checking auth state, redirecting, or if authenticated (will redirect soon)
  if (!mounted || authLoading || isRedirecting || isAuthenticated) {
    return (
      <div className='min-h-screen flex items-center justify-center' style={{ backgroundColor: '#131818' }}>
        <div className='w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin' />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      router.push('/shipments');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${API_URL}/auth/google`;
  };

  return (
    <div className='min-h-screen flex' style={{ backgroundColor: '#131818' }}>
      <div className='hidden lg:flex lg:w-1/2 relative overflow-hidden'>
        <div className='absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-transparent' />
        <div className='absolute inset-0' style={{ background: 'radial-gradient(circle at 30% 50%, rgba(255, 191, 101, 0.15) 0%, transparent 50%)' }} />
        <div className='absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl' />
        <div className='absolute bottom-1/4 right-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl' />
        
        <div className='relative z-10 flex flex-col justify-center px-20 py-20'>
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className='flex items-center gap-3 mb-8'
          >
            <div className='w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center backdrop-blur-sm'>
              <Plane className='w-8 h-8 text-primary' />
            </div>
            <span className='text-2xl font-bold text-white tracking-tight'>Gajan Traders</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className='text-4xl font-black text-white mb-4 leading-tight'
          >
            Ship Globally<br />
            <span className='text-primary'>With Confidence</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className='text-lg text-white/60 mb-10 max-w-md'
          >
            Trusted by 2000+ businesses worldwide for fast, reliable international shipping.
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
              <div key={i} className='flex items-center gap-3 text-white/70'>
                <div className='w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center'>
                  <feature.icon className='w-4 h-4 text-primary' />
                </div>
                <span>{feature.text}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      <div className='flex-1 flex items-center justify-center px-8 py-16 relative'>
        <div className='absolute inset-0 overflow-hidden lg:hidden'>
          <div className='absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl' />
          <div className='absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl' />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className='relative w-full max-w-md'
        >
          <div className='lg:hidden flex items-center justify-center gap-2 mb-8'>
            <div className='w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center'>
              <Plane className='w-5 h-5 text-primary' />
            </div>
            <span className='text-xl font-bold text-white'>Gajan Traders</span>
          </div>

          <div className='bg-white/[0.03] border border-white/10 backdrop-blur-xl rounded-3xl p-6 shadow-2xl'>
            <div className='text-center mb-6'>
              <h1 className='text-2xl font-bold text-white mb-2'>Welcome Back</h1>
              <p className='text-white/50 text-sm'>Sign in to manage your shipments</p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className='mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400'
              >
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className='space-y-4'>
              <div>
                <label className='block text-xs font-medium text-white/70 mb-1'>Email Address</label>
                <div className='relative'>
                  <Mail className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30' />
                  <input
                    type='email'
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder='you@example.com'
                    className='w-full pl-10 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all'
                    required
                  />
                </div>
              </div>

              <div>
                <label className='block text-xs font-medium text-white/70 mb-1'>Password</label>
                <div className='relative'>
                  <Lock className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30' />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder='Enter your password'
                    className='w-full pl-10 pr-10 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all'
                    required
                  />
                  <button
                    type='button'
                    onClick={() => setShowPassword(!showPassword)}
                    className='absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/50 transition-colors cursor-pointer'
                  >
                    {showPassword ? <EyeOff className='w-4 h-4' /> : <Eye className='w-4 h-4' />}
                  </button>
                </div>
              </div>

              <div className='flex items-center justify-between'>
                <label className='flex items-center gap-2 cursor-pointer'>
                  <input type='checkbox' className='w-3 h-3 rounded border-white/20 bg-white/5 text-primary focus:ring-primary/20' />
                  <span className='text-xs text-white/50'>Remember me</span>
                </label>
                <Link href='/forgot-password' className='text-xs text-primary hover:text-primary/80 transition-colors'>
                  Forgot password?
                </Link>
              </div>

              <button
                type='submit'
                disabled={isLoading}
                className='w-full flex items-center justify-center gap-2 py-2.5 bg-primary hover:bg-[#4C833E] text-white font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer'
              >
                {isLoading ? (
                  <div className='w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin' />
                ) : (
                  <>
                    Sign In
                    <ArrowRight className='w-4 h-4' />
                  </>
                )}
              </button>
            </form>

            <div className='relative my-4'>
              <div className='absolute inset-0 flex items-center'>
                <div className='w-full border-t border-white/10' />
              </div>
              <div className='relative flex justify-center text-xs'>
                <span className='px-3 bg-[#131818] text-white/40'>or continue with</span>
              </div>
            </div>

            <button
              type='button'
              onClick={handleGoogleLogin}
              className='w-full flex items-center justify-center gap-2 py-2.5 bg-white/5 border border-white/10 hover:border-white/20 text-white font-medium rounded-lg hover:bg-white/10 transition-all duration-200 cursor-pointer'
            >
              <svg className='w-4 h-4' viewBox='0 0 24 24'>
                <path fill='#4285F4' d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'/>
                <path fill='#34A853' d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'/>
                <path fill='#FBBC05' d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'/>
                <path fill='#EA4335' d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'/>
              </svg>
              Google
            </button>

            <div className='mt-4 text-center'>
              <p className='text-sm text-white/50'>
                Don't have an account?{' '}
                <Link href='/register' className='text-primary hover:text-primary/80 font-medium transition-colors'>
                  Sign up
                </Link>
              </p>
            </div>
          </div>

          <p className='text-center text-xs text-white/30 mt-4'>
            By signing in, you agree to our{' '}
            <Link href='/terms' className='text-white/40 hover:text-white/60 transition-colors'>
              Terms
            </Link>{' '}
            and{' '}
            <Link href='/privacy' className='text-white/40 hover:text-white/60 transition-colors'>
              Privacy Policy
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}