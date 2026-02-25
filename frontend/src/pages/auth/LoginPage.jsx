import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, LockKeyhole, Mail } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

export default function LoginPage() {
  const { register, handleSubmit } = useForm();
  const { login, loading } = useAuth();
  const { pushToast } = useToast();
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState('');

  const onSubmit = async (values) => {
    try {
      setErrorMessage('');
      const data = await login(values);
      pushToast('Login successful', 'success');
      navigate(data.user.role === 'ADMIN' ? '/admin' : '/student');
    } catch (error) {
      const message =
        error.response?.data?.error?.message ||
        (error.request ? 'Cannot reach server. Check backend is running and API URL is correct.' : 'Login failed');
      setErrorMessage(message);
      pushToast(message, 'error');
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24 }}>
      <div className="mb-7 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-text-secondary)]">Welcome Back</p>
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--color-text-primary)]">Sign in to your workspace</h1>
        <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">Access analytics, forms, and performance insights from one secure dashboard.</p>
      </div>

      {errorMessage ? (
        <div className="mb-4 rounded-2xl border border-red-300/45 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:border-red-400/35 dark:text-red-300">
          <p className="inline-flex items-center gap-2 font-medium">
            <AlertCircle className="h-4 w-4" />
            {errorMessage}
          </p>
        </div>
      ) : null}

      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <label className="block space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">Email</span>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[var(--color-text-secondary)]" />
            <Input placeholder="you@company.com" className="pl-10 py-3" autoComplete="email" {...register('email')} />
          </div>
        </label>

        <label className="block space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">Password</span>
          <div className="relative">
            <LockKeyhole className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[var(--color-text-secondary)]" />
            <Input placeholder="Enter your password" type="password" className="pl-10 py-3" autoComplete="current-password" {...register('password')} />
          </div>
        </label>

        <div className="flex items-center justify-between pt-1">
          <label className="inline-flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-[var(--line-soft)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
              {...register('remember')}
            />
            Remember me
          </label>
          <button type="button" className="text-sm font-semibold text-[var(--color-primary)] hover:text-[var(--color-primary-hover)]">
            Forgot password?
          </button>
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>

      <p className="mt-5 text-sm text-[var(--color-text-secondary)]">
        New account?{' '}
        <Link to="/register" className="font-semibold text-[var(--color-primary)] hover:text-[var(--color-primary-hover)]">
          Register
        </Link>
      </p>
    </motion.div>
  );
}
