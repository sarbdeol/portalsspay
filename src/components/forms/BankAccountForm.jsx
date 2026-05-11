import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Banknote, Building2, KeyRound, Link2, MessageSquare, ShieldCheck, Wallet } from 'lucide-react';
import Button from '../ui/Button.jsx';
import Input from '../ui/Input.jsx';
import Select from '../ui/Select.jsx';

const ACCOUNT_TYPES = ['Savings', 'Current', 'Business'];
const UPI_APPS = ['PhonePe', 'Google Pay', 'Paytm', 'BHIM', 'Amazon Pay', 'Other'];
const STATUSES = ['Active', 'Disabled', 'Pending', 'Hold'];
const PRIORITIES = ['High', 'Medium', 'Low'];

const schema = z.object({
  bankName: z.string().min(2, 'Bank name is required'),
  holderName: z.string().min(2, 'Holder name is required'),
  accountNumber: z.string().min(8, 'Account number is required'),
  ifsc: z.string().min(11, 'IFSC code is required'),
  branch: z.string().optional(),
  accountType: z.string().optional(),
  bankEmail: z.union([z.literal(''), z.string().email('Enter a valid email')]).optional(),
  upiId: z.string().min(3, 'UPI ID is required'),
  upiApp: z.string().optional(),
  upiMobile: z.string().optional(),
  customerId: z.string().optional(),
  userId: z.string().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
  transactionPassword: z.string().optional(),
  mpin: z.string().optional(),
  tpin: z.string().optional(),
  dailyLimit: z.coerce.number().optional(),
  monthlyLimit: z.coerce.number().optional(),
  currentUsage: z.coerce.number().optional(),
  beneficiaryTimeLimit: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  tags: z.string().optional(),
  agentId: z.union([z.string(), z.number()]).optional().nullable(),
  merchantId: z.union([z.string(), z.number()]).optional().nullable(),
  loginUrl: z.string().optional(),
  registeredMobile: z.string().optional(),
  recoveryEmail: z.string().optional(),
  whatsapp: z.string().optional(),
  notes: z.string().optional(),
});

function SectionHeading({ icon: Icon, title, hint }) {
  return (
    <div className="md:col-span-2 mt-2 flex items-center gap-3">
      <div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-950 text-white shadow-ios dark:bg-white dark:text-slate-950">
        <Icon size={18} />
      </div>
      <div>
        <p className="text-sm font-bold text-slate-900 dark:text-white">{title}</p>
        {hint ? <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{hint}</p> : null}
      </div>
    </div>
  );
}

export default function BankAccountForm({
  initialValues,
  agents = [],
  merchants = [],
  onSubmit,
  submitLabel = 'Save Account',
  showContactSection = true,
  showOwnershipSelectors = true,
}) {
  const tagsToString = (value) => (Array.isArray(value) ? value.join(', ') : value || '');

  const baseDefaults = {
    bankName: '',
    holderName: '',
    accountNumber: '',
    ifsc: '',
    branch: '',
    accountType: 'Current',
    bankEmail: '',
    upiId: '',
    upiApp: 'PhonePe',
    upiMobile: '',
    customerId: '',
    userId: '',
    username: '',
    password: '',
    transactionPassword: '',
    mpin: '',
    tpin: '',
    dailyLimit: 0,
    monthlyLimit: 0,
    currentUsage: 0,
    beneficiaryTimeLimit: '',
    status: 'Pending',
    priority: 'Medium',
    tags: '',
    agentId: '',
    merchantId: '',
    loginUrl: '',
    registeredMobile: '',
    recoveryEmail: '',
    whatsapp: '',
    notes: '',
  };

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      ...baseDefaults,
      ...initialValues,
      agentId: initialValues?.agentId ? String(initialValues.agentId) : '',
      merchantId: initialValues?.merchantId ? String(initialValues.merchantId) : '',
      tags: tagsToString(initialValues?.tags),
    },
  });

  const submit = (values) => {
    const normalized = {
      ...values,
      agentId: values.agentId ? Number(values.agentId) : null,
      merchantId: values.merchantId ? Number(values.merchantId) : null,
    };
    return onSubmit(normalized);
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="grid gap-4 md:grid-cols-2">
      <SectionHeading icon={Building2} title="Basic information" hint="Bank, holder and branch details" />
      <Input label="Bank Name" {...register('bankName')} error={errors.bankName?.message} />
      <Input label="Account Holder Name" {...register('holderName')} error={errors.holderName?.message} />
      <Input label="Account Number" {...register('accountNumber')} error={errors.accountNumber?.message} />
      <Input label="IFSC Code" {...register('ifsc')} error={errors.ifsc?.message} />
      <Input label="Branch Name" {...register('branch')} />
      <Select label="Account Type" options={ACCOUNT_TYPES} {...register('accountType')} />
      <div className="md:col-span-2">
        <Input label="Email Registered with Bank" type="email" placeholder="holder@example.com" {...register('bankEmail')} error={errors.bankEmail?.message} />
      </div>

      <SectionHeading icon={Wallet} title="UPI details" hint="Linked UPI handle and app" />
      <Input label="UPI ID" {...register('upiId')} error={errors.upiId?.message} />
      <Select label="UPI App Type" options={UPI_APPS} {...register('upiApp')} />
      <Input label="UPI Mobile Number" {...register('upiMobile')} />

      <SectionHeading icon={KeyRound} title="Internet banking credentials" hint="Sensitive — stored encrypted on backend" />
      <Input label="Customer ID" {...register('customerId')} />
      <Input label="User ID" {...register('userId')} />
      <Input label="Login Username" {...register('username')} />
      <Input label="Login Password" type="password" {...register('password')} />
      <Input label="Transaction Password" type="password" {...register('transactionPassword')} />
      <Input label="MPIN" type="password" {...register('mpin')} />
      <Input label="TPIN" type="password" {...register('tpin')} />

      <SectionHeading icon={Banknote} title="Limits & transactions" hint="Daily, monthly and usage caps" />
      <Input label="Daily Transaction Limit" type="number" {...register('dailyLimit')} />
      <Input label="Monthly Limit" type="number" {...register('monthlyLimit')} />
      <Input label="Current Usage" type="number" {...register('currentUsage')} />
      <Input label="Beneficiary Time Limit" placeholder="e.g. 30 minutes, 24 hours" {...register('beneficiaryTimeLimit')} />

      <SectionHeading icon={ShieldCheck} title="Status & classification" hint="Lifecycle, priority and tagging" />
      <Select label="Status" options={STATUSES} {...register('status')} />
      <Select label="Priority" options={PRIORITIES} {...register('priority')} />
      <Input label="Tags (comma separated)" {...register('tags')} />
      {showOwnershipSelectors ? (
        <>
          <Select label="Agent" {...register('agentId')}>
            <option value="">Unassigned</option>
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>{agent.name}</option>
            ))}
          </Select>
          <Select label="Merchant" {...register('merchantId')}>
            <option value="">Unassigned</option>
            {merchants.map((merchant) => (
              <option key={merchant.id} value={merchant.id}>{merchant.name}</option>
            ))}
          </Select>
        </>
      ) : null}

      {showContactSection ? (
        <>
          <SectionHeading icon={MessageSquare} title="Contact & recovery" hint="Mobile, email, WhatsApp for ops" />
          <Input label="Registered Mobile Number" {...register('registeredMobile')} />
          <Input label="Recovery Email" {...register('recoveryEmail')} />
          <Input label="WhatsApp Number" {...register('whatsapp')} />
        </>
      ) : null}

      <SectionHeading icon={Link2} title="Net banking login" hint="Quick-launch URL for ops team" />
      <div className="md:col-span-2">
        <Input label="Net Banking Login URL" {...register('loginUrl')} placeholder="https://netbanking.bank.in/" />
      </div>
      <div className="md:col-span-2">
        <Input label="Notes" {...register('notes')} placeholder="Optional notes about this account" />
      </div>

      <div className="md:col-span-2 flex items-center justify-end pt-2">
        <Button type="submit" disabled={isSubmitting} className="h-12 px-6">
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
