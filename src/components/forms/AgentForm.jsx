import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import Button from '../ui/Button.jsx';
import Input from '../ui/Input.jsx';

const schema = z.object({
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
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: initialValues || { name: '', mobile: '', whatsapp: '', telegram: '', email: '', password: '', address: '', notes: '' },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 md:grid-cols-2">
      <Input label="Full Name" {...register('name')} error={errors.name?.message} />
      <Input label="Mobile Number" {...register('mobile')} error={errors.mobile?.message} />
      <Input label="WhatsApp Number" {...register('whatsapp')} error={errors.whatsapp?.message} />
      <Input label="Telegram Username" {...register('telegram')} />
      <Input label="Email" {...register('email')} error={errors.email?.message} />
      <Input label={initialValues ? 'New Password' : 'Password'} type="password" {...register('password')} error={errors.password?.message} />
      <Input label="Address" {...register('address')} />
      <div className="md:col-span-2"><Input label="Notes" {...register('notes')} /></div>
      <div className="md:col-span-2"><Button type="submit">{submitLabel}</Button></div>
    </form>
  );
}
