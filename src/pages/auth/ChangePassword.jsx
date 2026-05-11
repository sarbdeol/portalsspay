import { Lock } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Page from '../../components/Page.jsx';
import Button from '../../components/ui/Button.jsx';
import Card from '../../components/ui/Card.jsx';
import Input from '../../components/ui/Input.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import { crmApi } from '../../services/crmApi.js';
import { unwrapError } from '../../hooks/useCrm.js';

const schema = z
  .object({
    currentPassword: z.string().min(1, 'Current password required'),
    newPassword: z.string().min(4, 'At least 4 characters'),
    confirmPassword: z.string().min(4, 'Confirm new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export default function ChangePassword() {
  const { notify } = useToast();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const onSubmit = async ({ currentPassword, newPassword }) => {
    setLoading(true);
    try {
      await crmApi.changePassword({ currentPassword, newPassword });
      notify('Password updated');
      reset();
    } catch (err) {
      notify(unwrapError(err), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page title="Change Password" eyebrow="Security">
      <Card className="max-w-xl">
        <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
          <Input label="Current Password" icon={Lock} type="password" {...register('currentPassword')} error={errors.currentPassword?.message} />
          <Input label="New Password" icon={Lock} type="password" {...register('newPassword')} error={errors.newPassword?.message} />
          <Input label="Confirm New Password" icon={Lock} type="password" {...register('confirmPassword')} error={errors.confirmPassword?.message} />
          <Button type="submit" disabled={loading}>{loading ? 'Updating...' : 'Update password'}</Button>
        </form>
      </Card>
    </Page>
  );
}
