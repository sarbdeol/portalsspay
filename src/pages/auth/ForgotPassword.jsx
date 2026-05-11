import { Mail } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import { crmApi } from '../../services/crmApi.js';
import { unwrapError } from '../../hooks/useCrm.js';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
});

export default function ForgotPassword() {
  const { notify } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [issued, setIssued] = useState(null);
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  const onSubmit = async ({ email }) => {
    setLoading(true);
    try {
      const result = await crmApi.forgotPassword(email);
      if (result.uid && result.token) {
        setIssued({ uid: result.uid, token: result.token });
        notify('Reset token generated');
      } else {
        notify(result.detail || 'If the email exists, a reset link has been generated');
      }
    } catch (err) {
      notify(unwrapError(err), 'error');
    } finally {
      setLoading(false);
    }
  };

  const goToReset = () => {
    navigate(`/reset-password?uid=${encodeURIComponent(issued.uid)}&token=${encodeURIComponent(issued.token)}`);
  };

  return (
    <form className="glass w-full max-w-md rounded-[2rem] p-8" onSubmit={handleSubmit(onSubmit)}>
      <h2 className="text-3xl font-bold">Recover access</h2>
      <p className="mt-2 text-sm text-slate-500">Send a secure reset token to the registered email.</p>
      <div className="mt-7">
        <Input label="Email" icon={Mail} placeholder="you@company.in" {...register('email')} error={errors.email?.message} />
      </div>
      <Button type="submit" disabled={loading} className="mt-6 w-full">
        {loading ? 'Generating...' : 'Send reset token'}
      </Button>

      {issued ? (
        <div className="mt-6 rounded-2xl border border-teal-300/40 bg-teal-50/70 p-4 text-sm dark:bg-teal-500/10">
          <p className="font-bold text-teal-800 dark:text-teal-200">Token generated</p>
          <p className="mt-1 break-all text-xs text-slate-600 dark:text-slate-300">
            <span className="font-bold">uid:</span> {issued.uid}
            <br />
            <span className="font-bold">token:</span> {issued.token}
          </p>
          <Button type="button" onClick={goToReset} className="mt-3 w-full">Continue to reset</Button>
        </div>
      ) : null}

      <Link className="mt-5 block text-center text-sm font-bold text-teal-700 dark:text-teal-300" to="/login">
        Back to login
      </Link>
    </form>
  );
}
