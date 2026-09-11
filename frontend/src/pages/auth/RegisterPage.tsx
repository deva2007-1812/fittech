import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { LoadingSpinner } from '../../components/shared/LoadingSpinner';
import { getApiErrorMessage } from '../../services/api';
import toast from 'react-hot-toast';

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 8) e.password = 'Password must be at least 8 characters';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setIsLoading(true);
    try {
      await register(form.name, form.email, form.password);
      toast.success('Account created! Let\'s set up your profile.');
      navigate('/onboarding');
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [field]: e.target.value }));
    if (errors[field]) setErrors(ev => ({ ...ev, [field]: '' }));
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Create your account</h2>
        <p className="text-neutral-500 dark:text-neutral-400 mt-1 text-sm">Start your personalized fitness journey today.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Name */}
        <div className="input-group">
          <label htmlFor="name" className="label">Full name</label>
          <div className="relative">
            <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input id="name" type="text" autoComplete="name" value={form.name}
              onChange={set('name')}
              className={`input pl-10 ${errors.name ? 'border-red-400 focus:ring-red-400' : ''}`}
              placeholder="Alex Johnson"
              aria-invalid={!!errors.name}
            />
          </div>
          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
        </div>

        {/* Email */}
        <div className="input-group">
          <label htmlFor="reg-email" className="label">Email address</label>
          <div className="relative">
            <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input id="reg-email" type="email" autoComplete="email" value={form.email}
              onChange={set('email')}
              className={`input pl-10 ${errors.email ? 'border-red-400 focus:ring-red-400' : ''}`}
              placeholder="you@example.com"
              aria-invalid={!!errors.email}
            />
          </div>
          {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
        </div>

        {/* Password */}
        <div className="input-group">
          <label htmlFor="reg-password" className="label">Password</label>
          <div className="relative">
            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input id="reg-password" type={showPw ? 'text' : 'password'} autoComplete="new-password"
              value={form.password} onChange={set('password')}
              className={`input pl-10 pr-10 ${errors.password ? 'border-red-400 focus:ring-red-400' : ''}`}
              placeholder="Min. 8 characters"
              aria-invalid={!!errors.password}
            />
            <button type="button" onClick={() => setShowPw(!showPw)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
              aria-label={showPw ? 'Hide password' : 'Show password'}
            >
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
        </div>

        {/* Confirm Password */}
        <div className="input-group">
          <label htmlFor="confirm-password" className="label">Confirm password</label>
          <div className="relative">
            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input id="confirm-password" type={showPw ? 'text' : 'password'} autoComplete="new-password"
              value={form.confirmPassword} onChange={set('confirmPassword')}
              className={`input pl-10 ${errors.confirmPassword ? 'border-red-400 focus:ring-red-400' : ''}`}
              placeholder="Re-enter your password"
              aria-invalid={!!errors.confirmPassword}
            />
          </div>
          {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword}</p>}
        </div>

        <button type="submit" className="btn-primary w-full py-3 mt-2" disabled={isLoading}>
          {isLoading ? <LoadingSpinner size="sm" /> : 'Create account'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-neutral-500 dark:text-neutral-400">
        Already have an account?{' '}
        <Link to="/login" className="text-emerald-600 dark:text-emerald-400 font-semibold hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors">
          Sign in
        </Link>
      </p>
    </div>
  );
}
