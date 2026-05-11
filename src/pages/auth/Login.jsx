import { zodResolver } from '@hookform/resolvers/zod';
import { Lock, Mail } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import { useAuthStore } from '../../store/authStore.js';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

export default function Login() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const { notify } = useToast();
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values) => {
    setLoading(true);
    try {
      const home = await login(values);
      navigate(home);
    } catch (error) {
      notify(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="glass w-full max-w-sm rounded-3xl p-8"
    >
      <h2 className="text-center text-2xl font-bold tracking-tight">Login</h2>
      <div className="mt-6 space-y-4">
        <Input label="Email" icon={Mail} placeholder="you@company.in" {...register('email')} error={errors.email?.message} />
        <Input label="Password" icon={Lock} type="password" placeholder="Enter password" {...register('password')} error={errors.password?.message} />
      </div>
      <Button type="submit" disabled={loading} className="mt-6 h-12 w-full">
        {loading ? 'Logging in...' : 'Login'}
      </Button>
      <Link to="/forgot-password" className="mt-5 block text-center text-sm font-semibold text-teal-700 hover:text-teal-800 dark:text-teal-300">
        Forgot password?
      </Link>
    </form>
  );
}
