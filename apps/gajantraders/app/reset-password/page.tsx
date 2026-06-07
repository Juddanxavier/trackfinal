'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lock, Plane, ArrowRight, Eye, EyeOff, AlertCircle, CheckCircle, Globe, Package, Shield } from 'lucide-react';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      router.push('/login?reset=success');
    } catch (err) {
      setError('Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='min-h-screen flex' style={{ backgroundColor: '#131818' }}>
      <div className='hidden lg:flex lg:w-1/2 relative overflow-hidden'>
        <div className='absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-transparent' />
        <div className='absolute inset-0' style={{ background: 'radial-gradient(circle at 30% 50%, rgba(255, 191, 101, 0.15) 0%, transparent 50%)' }} />
        <div className='absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl' />
        <div className='absolute bottom-1/4 right-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl' />
        
        <div className='relative z-10 flex flex-col justify-center pl-20 pr-12 py-20'>
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
            className='text-3xl font-semibold text-white mb-4 leading-tight'
          >
            Create New<br />
            <span className='text-primary'>Password</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className='text-lg text-white/60 mb-10 max-w-md'
          >
            Your new password must be different from previously used passwords.
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
                <div className='text-2xl font-bold text-white'>{stat.value}</div>
                <div className='text-sm text-white/40 mt-1'>{stat.label}</div>
              </div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className='mt-8 flex items-center gap-4'
          >
            <div className='flex -space-x-2'>
              {['JD', 'AS', 'RK', 'MK'].map((initials, i) => (
                <div key={i} className='w-8 h-8 rounded-full bg-primary/60 border-2 border-[#131818] flex items-center justify-center text-xs font-bold text-white'>
                  {initials}
                </div>
              ))}
            </div>
            <span className='text-sm text-white/50'>Trusted by 2000+ businesses worldwide</span>
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
                <Lock className='w-7 h-7 text-primary' />
              </div>
              <h1 className='text-2xl font-bold text-white mb-2'>Set New Password</h1>
              <p className='text-white/50'>Enter your new password below</p>
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
                <label className='block text-sm font-medium text-white/70 mb-2'>New Password</label>
                <div className='relative'>
                  <Lock className='absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30' />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder='Min. 8 characters'
                    className='w-full pl-12 pr-12 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all'
                    required
                    minLength={8}
                  />
                  <button
                    type='button'
                    onClick={() => setShowPassword(!showPassword)}
                    className='absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/50 transition-colors cursor-pointer'
                  >
                    {showPassword ? <EyeOff className='w-5 h-5' /> : <Eye className='w-5 h-5' />}
                  </button>
                </div>
              </div>

              <div>
                <label className='block text-sm font-medium text-white/70 mb-2'>Confirm Password</label>
                <div className='relative'>
                  <Lock className='absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30' />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder='Confirm your password'
                    className='w-full pl-12 pr-12 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all'
                    required
                    minLength={8}
                  />
                  <button
                    type='button'
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className='absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/50 transition-colors cursor-pointer'
                  >
                    {showConfirmPassword ? <EyeOff className='w-5 h-5' /> : <Eye className='w-5 h-5' />}
                  </button>
                </div>
              </div>

              <div className='space-y-2'>
                <div className={`flex items-center gap-2 text-sm ${password.length >= 8 ? 'text-green-400' : 'text-white/30'}`}>
                  <CheckCircle className='w-4 h-4' />
                  At least 8 characters
                </div>
                <div className={`flex items-center gap-2 text-sm ${/[A-Z]/.test(password) ? 'text-green-400' : 'text-white/30'}`}>
                  <CheckCircle className='w-4 h-4' />
                  One uppercase letter
                </div>
                <div className={`flex items-center gap-2 text-sm ${/[0-9]/.test(password) ? 'text-green-400' : 'text-white/30'}`}>
                  <CheckCircle className='w-4 h-4' />
                  One number
                </div>
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
                    Reset Password
                    <ArrowRight className='w-4 h-4' />
                  </>
                )}
              </button>
            </form>

            <div className='mt-6 text-center'>
              <p className='text-sm text-white/50'>
                Back to{' '}
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
