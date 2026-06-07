'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { User, Phone, Plane, ArrowRight, Mail, CheckCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export default function OnboardingPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [mounted, authLoading, isAuthenticated, router]);

  if (!mounted || authLoading || !isAuthenticated) {
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
      const token = localStorage.getItem('gt_access_token');
      const response = await fetch(`${API_URL}/auth/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({ name, phoneNumber: phone || undefined }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to save profile');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/verify-email');
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
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
            <h1 className='text-2xl font-bold text-white mb-3'>Profile Saved!</h1>
            <p className='text-white/50 mb-2'>Now verify your email to start shipping.</p>
            <p className='text-sm text-white/40'>Redirecting to verification...</p>
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
            Almost Done<br />
            <span className='text-primary'>Set Up Your Profile</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className='text-lg text-white/60 mb-10 max-w-md'
          >
            Just a few more details to get you started.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className='space-y-4'
          >
            {[
              { icon: Mail, text: 'Verify your email' },
              { icon: User, text: 'Complete your profile' },
              { icon: Plane, text: 'Start shipping globally' },
            ].map((step, i) => (
              <div key={i} className='flex items-center gap-3 text-white/70'>
                <div className='w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center'>
                  <step.icon className='w-4 h-4 text-primary' />
                </div>
                <span>{step.text}</span>
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
              <div className='w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3'>
                <User className='w-6 h-6 text-primary' />
              </div>
              <h1 className='text-2xl font-bold text-white mb-2'>Complete Your Profile</h1>
              <p className='text-white/50 text-sm'>
                Signed in as <span className='text-white/70'>{user?.email}</span>
              </p>
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
                <label className='block text-sm font-medium text-white/70 mb-1'>Full Name</label>
                <div className='relative'>
                  <User className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30' />
                  <input
                    type='text'
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder='John Doe'
                    className='w-full pl-10 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all'
                    required
                    minLength={2}
                  />
                </div>
              </div>

              <div>
                <label className='block text-sm font-medium text-white/70 mb-1'>Phone Number</label>
                <div className='relative'>
                  <Phone className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30' />
                  <input
                    type='tel'
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder='+1 234 567 890'
                    className='w-full pl-10 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all'
                  />
                </div>
              </div>

              <p className='text-xs text-white/40'>
                You'll need to verify your email after this step.
              </p>

              <button
                type='submit'
                disabled={isLoading}
                className='w-full flex items-center justify-center gap-2 py-2.5 bg-primary hover:bg-[#172554] text-white font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer'
              >
                {isLoading ? (
                  <div className='w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin' />
                ) : (
                  <>
                    Continue
                    <ArrowRight className='w-4 h-4' />
                  </>
                )}
              </button>
            </form>
          </div>

          <p className='text-center text-xs text-white/30 mt-4'>
            Already verified?{' '}
            <Link href='/shipments' className='text-white/40 hover:text-white/60 transition-colors'>
              Go to dashboard
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
