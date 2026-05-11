import { Lock } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import { crmApi } from '../../services/crmApi.js';
import { unwrapError } from '../../hooks/useCrm.js';

const schema = z
  .object({
    uid: z.string().min(1, 'UID is required'),
    token: z.string().min(1, 'Token is required'),
    newPassword: z.string().min(4, 'At least 4 characters'),
    confirmPassword: z.string().min(4, 'Confirm new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export default function ResetPassword() {
  const { notify } = useToast();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      uid: searchParams.get('uid') || '',
      token: searchParams.get('token') || '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async ({ uid, token, newPassword }) => {
    setLoading(true);
    try {
      await crmApi.resetPassword({ uid, token, newPassword });
      notify('Password reset successfully');
      navigate('/login');
    } catch (err) {
      notify(unwrapError(err), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="glass w-full max-w-md rounded-[2rem] p-8" onSubmit={handleSubmit(onSubmit)}>
      <h2 className="text-3xl font-bold">Reset password</h2>
      <p className="mt-2 text-sm text-slate-500">Paste the uid + token from the recover step and set a new password.</p>
      <div className="mt-7 space-y-5">
        <Input label="UID" {...register('uid')} error={errors.uid?.message} />
        <Input label="Token" {...register('token')} error={errors.token?.message} />
        <Input label="New Password" icon={Lock} type="password" {...register('newPassword')} error={errors.newPassword?.message} />
        <Input label="Confirm Password" icon={Lock} type="password" {...register('confirmPassword')} error={errors.confirmPassword?.message} />
      </div>
      <Button type="submit" disabled={loading} className="mt-6 w-full">
        {loading ? 'Resetting...' : 'Reset password'}
      </Button>
      <Link className="mt-5 block text-center text-sm font-bold text-teal-700 dark:text-teal-300" to="/login">
        Back to login
      </Link>
    </form>
  );
}
