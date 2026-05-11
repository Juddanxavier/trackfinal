'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Plane, ArrowRight, AlertCircle, CheckCircle, Globe, Package, Shield } from 'lucide-react';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSuccess(true);
    } catch (err) {
      setError('Failed to send reset link. Please try again.');
    } finally {
      setIsLoading(false);
    }
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
            <h1 className='text-2xl font-bold text-white mb-3'>Check Your Email</h1>
            <p className='text-white/50 mb-6'>
              We've sent a password reset link to <span className='text-white'>{email}</span>
            </p>
            <p className='text-sm text-white/40 mb-6'>
              Didn't receive the email? Check your spam folder or{' '}
              <button onClick={() => setSuccess(false)} className='text-primary hover:text-primary/80'>
                try again
              </button>
            </p>
            <Link
              href='/login'
              className='inline-flex items-center justify-center gap-2 py-3 bg-primary hover:bg-[#4C833E] text-white font-semibold rounded-xl transition-all duration-200 w-full'
            >
              Back to Sign In
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

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
            Reset Your<br />
            <span className='text-primary'>Password</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className='text-lg text-white/60 mb-10 max-w-md'
          >
            No worries! Enter your email and we'll send you a link to reset your password.
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

          <div className='bg-white/[0.03] border border-white/10 backdrop-blur-xl rounded-3xl p-10 shadow-2xl'>
            <div className='text-center mb-8'>
              <div className='w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4'>
                <Mail className='w-7 h-7 text-primary' />
              </div>
              <h1 className='text-2xl font-bold text-white mb-2'>Forgot Password?</h1>
              <p className='text-white/50'>Enter your email and we'll send you a reset link</p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className='mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3'
              >
                <AlertCircle className='w-5 h-5 text-red-400 shrink-0' />
                <p className='text-sm text-red-400'>{error}</p>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className='space-y-5'>
              <div>
                <label className='block text-sm font-medium text-white/70 mb-2'>Email Address</label>
                <div className='relative'>
                  <Mail className='absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30' />
                  <input
                    type='email'
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder='you@example.com'
                    className='w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all'
                    required
                  />
                </div>
              </div>

              <button
                type='submit'
                disabled={isLoading}
                className='w-full flex items-center justify-center gap-2 py-3 bg-primary hover:bg-[#4C833E] text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer'
              >
                {isLoading ? (
                  <div className='w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin' />
                ) : (
                  <>
                    Send Reset Link
                    <ArrowRight className='w-4 h-4' />
                  </>
                )}
              </button>
            </form>

            <div className='mt-6 text-center'>
              <p className='text-sm text-white/50'>
                Remember your password?{' '}
                <Link href='/login' className='text-primary hover:text-primary/80 font-medium transition-colors'>
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}