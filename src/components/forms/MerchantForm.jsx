import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import Button from '../ui/Button.jsx';
import Input from '../ui/Input.jsx';

const createSchema = z.object({
  username: z.string().min(2, 'Username is required'),
  password: z.string().min(4, 'Password must be 4+ characters'),
});

const editSchema = z.object({
  name: z.string().optional(),
  username: z.string().optional(),
  email: z.string().optional(),
  password: z.string().min(4, 'Password must be 4+ characters').optional().or(z.literal('')),
  agentId: z.string().optional(),
  city: z.string().optional(),
  volume: z.string().optional(),
});

export default function MerchantForm({ agents = [], initialValues, onSubmit, submitLabel = 'Save Merchant' }) {
  const isEdit = Boolean(initialValues);
  const defaultValues = isEdit
    ? {
        name: '',
        username: '',
        email: '',
        password: '',
        agentId: initialValues?.agentId || agents.find((agent) => agent.name === initialValues?.agent)?.id || '',
        city: '',
        volume: 'INR 0',
        ...initialValues,
      }
    : { username: '', password: '' };

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(isEdit ? editSchema : createSchema),
    defaultValues,
  });

  if (!isEdit) {
    return (
      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
        <Input label="Username" placeholder="merchant_name" {...register('username')} error={errors.username?.message} />
        <Input label="Password" type="password" {...register('password')} error={errors.password?.message} />
        <Button type="submit">{submitLabel}</Button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 md:grid-cols-2">
      <Input label="Merchant Name" {...register('name')} error={errors.name?.message} />
      <Input label="Username" {...register('username')} error={errors.username?.message} />
      <Input label="Email" {...register('email')} error={errors.email?.message} />
      <Input label="New Password" type="password" {...register('password')} error={errors.password?.message} />
      <label className="group block">
        <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Assigned Agent</span>
        <select
          {...register('agentId')}
          className="h-13 w-full rounded-2xl border border-white/70 bg-white/70 px-4 text-sm font-semibold text-slate-900 shadow-sm outline-none backdrop-blur-xl transition focus:border-teal-400 focus:ring-4 focus:ring-teal-400/15 dark:border-white/10 dark:bg-white/[0.08] dark:text-white"
        >
          <option value="">None</option>
          {agents.map((agent) => (
            <option key={agent.id} value={agent.id}>{agent.name}</option>
          ))}
        </select>
      </label>
      <Input label="City" {...register('city')} error={errors.city?.message} />
      <Input label="Monthly Volume" {...register('volume')} />
      <div className="md:col-span-2"><Button type="submit">{submitLabel}</Button></div>
    </form>
  );
}
