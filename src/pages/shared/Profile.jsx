import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Page from '../../components/Page.jsx';
import Card from '../../components/ui/Card.jsx';
import Input from '../../components/ui/Input.jsx';
import Button from '../../components/ui/Button.jsx';
import { useMe, useUpdateMe, unwrapError } from '../../hooks/useCrm.js';
import { useToast } from '../../components/ui/Toast.jsx';

export default function Profile() {
  const { notify } = useToast();
  const { data: me, isLoading, isError, error } = useMe();
  const updateMe = useUpdateMe();

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm({
    defaultValues: {
      name: '',
      email: '',
      mobile: '',
      whatsapp: '',
      telegram: '',
      address: '',
      notes: '',
    },
  });

  useEffect(() => {
    if (me) {
      reset({
        name: me.name || '',
        email: me.email || '',
        mobile: me.mobile || '',
        whatsapp: me.whatsapp || '',
        telegram: me.telegram || '',
        address: me.address || '',
        notes: me.notes || '',
      });
    }
  }, [me, reset]);

  const onSubmit = async (values) => {
    try {
      await updateMe.mutateAsync(values);
      notify('Profile updated');
    } catch (err) {
      notify(unwrapError(err), 'error');
    }
  };

  if (isLoading) {
    return (
      <Page title="Profile" eyebrow="Loading">
        <Card><p className="text-sm font-semibold text-slate-500">Loading profile...</p></Card>
      </Page>
    );
  }

  if (isError) {
    return (
      <Page title="Profile" eyebrow="Error">
        <Card><p className="text-sm font-semibold text-rose-600">{unwrapError(error)}</p></Card>
      </Page>
    );
  }

  return (
    <Page title="Profile" eyebrow={`${me?.role || ''} account`}>
      <Card>
        <form className="grid gap-5 lg:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
          <Input label="Full Name" {...register('name')} />
          <Input label="Email" type="email" {...register('email')} />
          <Input label="Mobile Number" {...register('mobile')} />
          <Input label="WhatsApp Number" {...register('whatsapp')} />
          <Input label="Telegram Username" {...register('telegram')} />
          <Input label="Address" {...register('address')} />
          <div className="lg:col-span-2"><Input label="Notes" {...register('notes')} /></div>
          <div className="lg:col-span-2">
            <Button type="submit" disabled={isSubmitting || updateMe.isPending}>
              {updateMe.isPending ? 'Saving...' : 'Save profile'}
            </Button>
          </div>
        </form>
      </Card>
    </Page>
  );
}
