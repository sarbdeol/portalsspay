import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import Button from '../ui/Button.jsx';
import Input from '../ui/Input.jsx';

const createSchema = z.object({
  email: z.string().email('Valid username (email) is required'),
  password: z.string().min(4, 'Password must be 4+ characters'),
  name: z.string().optional(),
  mobile: z.string().optional(),
  whatsapp: z.string().optional(),
  telegram: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});

const editSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  mobile: z.string().min(8, 'Mobile number is required'),
  whatsapp: z.string().min(8, 'WhatsApp number is required'),
  telegram: z.string().optional(),
  email: z.string().email('Valid email is required'),
  password: z.string().min(4, 'Password must be 4+ characters').optional().or(z.literal('')),
  address: z.string().optional(),
  notes: z.string().optional(),
});

export default function AgentForm({ initialValues, onSubmit, submitLabel = 'Save Agent' }) {
  const isEdit = Boolean(initialValues);
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(isEdit ? editSchema : createSchema),
    defaultValues: initialValues || { name: '', mobile: '', whatsapp: '', telegram: '', email: '', password: '', address: '', notes: '' },
  });

  if (!isEdit) {
    return (
      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
        <Input label="Username" placeholder="agent@company.in" {...register('email')} error={errors.email?.message} />
        <Input label="Password" type="password" {...register('password')} error={errors.password?.message} />
        <Button type="submit">{submitLabel}</Button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 md:grid-cols-2">
      <Input label="Full Name" {...register('name')} error={errors.name?.message} />
      <Input label="Mobile Number" {...register('mobile')} error={errors.mobile?.message} />
      <Input label="WhatsApp Number" {...register('whatsapp')} error={errors.whatsapp?.message} />
      <Input label="Telegram Username" {...register('telegram')} />
      <Input label="Email" {...register('email')} error={errors.email?.message} />
      <Input label="New Password" type="password" {...register('password')} error={errors.password?.message} />
      <Input label="Address" {...register('address')} />
      <div className="md:col-span-2"><Input label="Notes" {...register('notes')} /></div>
      <div className="md:col-span-2"><Button type="submit">{submitLabel}</Button></div>
    </form>
  );
}
