import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { Banknote, Building2, CreditCard, KeyRound, Link2, MessageSquare, ShieldCheck, Users, Wallet } from 'lucide-react';
import Button from '../ui/Button.jsx';
import Input from '../ui/Input.jsx';
import Select from '../ui/Select.jsx';

const ACCOUNT_TYPES = ['Savings Account', 'Current Account', 'Corp Account'];
const UPI_APPS = ['PhonePe', 'Google Pay', 'Paytm', 'BHIM', 'Amazon Pay', 'Other'];
const STATUSES = ['Active', 'Disabled', 'Pending', 'Hold'];
const PRIORITIES = ['High', 'Medium', 'Low'];

const schema = z.object({
  bankName: z.string().min(2, 'Bank name is required'),
  holderName: z.string().optional(),
  companyName: z.string().optional(),
  companyPan: z.string().optional(),
  gstNumber: z.string().optional(),
  authorizedSignatory: z.string().optional(),
  accountNumber: z.string().min(8, 'Account number is required'),
  ifsc: z.string().min(11, 'IFSC code is required'),
  branch: z.string().optional(),
  accountType: z.string().optional(),
  bankEmail: z.union([z.literal(''), z.string().email('Enter a valid email')]).optional(),
  upiId: z.string().optional(),
  upiApp: z.string().optional(),
  upiMobile: z.string().optional(),
  customerId: z.string().optional(),
  groupId: z.string().optional(),
  userId: z.string().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
  transactionPassword: z.string().optional(),
  authoriserPassword: z.string().optional(),
  mpin: z.string().optional(),
  tpin: z.string().optional(),
  checkerUserId: z.string().optional(),
  checkerPassword: z.string().optional(),
  makerUserId: z.string().optional(),
  makerPassword: z.string().optional(),
  authoriserUserId: z.string().optional(),
  authoriserUserPassword: z.string().optional(),
  cardNumber: z.string().optional(),
  cardHolderName: z.string().optional(),
  cardExpiry: z.string().optional(),
  cardCvv: z.string().optional(),
  atmPin: z.string().optional(),
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
  showAgentSelector = true,
  showMerchantSelector = true,
}) {
  const tagsToString = (value) => (Array.isArray(value) ? value.join(', ') : value || '');

  const baseDefaults = {
    bankName: '',
    holderName: '',
    companyName: '',
    companyPan: '',
    gstNumber: '',
    authorizedSignatory: '',
    accountNumber: '',
    ifsc: '',
    branch: '',
    accountType: 'Savings Account',
    bankEmail: '',
    upiId: '',
    upiApp: 'PhonePe',
    upiMobile: '',
    customerId: '',
    groupId: '',
    userId: '',
    username: '',
    password: '',
    transactionPassword: '',
    authoriserPassword: '',
    mpin: '',
    tpin: '',
    checkerUserId: '',
    checkerPassword: '',
    makerUserId: '',
    makerPassword: '',
    authoriserUserId: '',
    authoriserUserPassword: '',
    cardNumber: '',
    cardHolderName: '',
    cardExpiry: '',
    cardCvv: '',
    atmPin: '',
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

  const { register, handleSubmit, control, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      ...baseDefaults,
      ...initialValues,
      agentId: initialValues?.agentId ? String(initialValues.agentId) : '',
      merchantId: initialValues?.merchantId ? String(initialValues.merchantId) : '',
      tags: tagsToString(initialValues?.tags),
    },
  });

  const accountType = useWatch({ control, name: 'accountType' });
  const isCorp = accountType === 'Corp Account';
  const isSavings = accountType === 'Savings Account';
  const isCurrentOrCorp = !isSavings; // Current Account or Corp Account

  // Stop Chrome/Edge/Safari from prefilling these with the user's portal
  // login credentials. Using new-password on password inputs and off on the
  // identifiers is the combination that actually works across browsers.
  const noFillText = { autoComplete: 'off' };
  const noFillPassword = { autoComplete: 'new-password' };

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
      <SectionHeading icon={Building2} title="Basic information" hint="Bank, account type and branch" />
      <Input label="Bank Name" {...register('bankName')} error={errors.bankName?.message} />
      <Select label="Account Type" options={ACCOUNT_TYPES} {...register('accountType')} />
      {isCorp ? (
        <>
          <Input label="Company Name" {...register('companyName')} />
          <Input label="Account Holder Name" {...register('holderName')} />
          <Input label="Authorized Signatory" {...register('authorizedSignatory')} />
        </>
      ) : (
        <>
          <Input label="Account Holder Name" {...register('holderName')} />
        </>
      )}
      <Input label="Account Number" {...register('accountNumber')} error={errors.accountNumber?.message} />
      <Input label="IFSC Code" {...register('ifsc')} error={errors.ifsc?.message} />
      <Input label="Branch Name" {...register('branch')} />
      <div className="md:col-span-2">
        <Input label="Email Registered with Bank" type="email" placeholder="holder@example.com" {...register('bankEmail')} error={errors.bankEmail?.message} />
      </div>

      {isCorp ? (
        <>
          <SectionHeading icon={Building2} title="Corporate identity" hint="Tax & regulatory identifiers" />
          <Input label="Company PAN" {...register('companyPan')} />
          <Input label="GST Number" {...register('gstNumber')} />
        </>
      ) : null}

      <SectionHeading icon={Wallet} title="UPI details" hint="Linked UPI handle and app" />
      <Input label="UPI ID" {...register('upiId')} />
      <Select label="UPI App Type" options={UPI_APPS} {...register('upiApp')} />
      <Input label="UPI Mobile Number" {...register('upiMobile')} />

      <SectionHeading
        icon={KeyRound}
        title="Internet banking credentials"
        hint={isSavings ? 'Savings — login ID, password, MPIN.' : 'Current / Corp — full credential set + 3-user authorization.'}
      />
      {isSavings ? (
        <>
          {/* Decoy fields trick Chrome's autofill so the real login ID / password
              below aren't overwritten with the portal user's saved password. */}
          <input type="text" name="fakeusernameremembered" className="hidden" autoComplete="username" tabIndex={-1} aria-hidden="true" />
          <input type="password" name="fakepasswordremembered" className="hidden" autoComplete="current-password" tabIndex={-1} aria-hidden="true" />
          <Input label="User ID / Login ID" {...register('username')} {...noFillText} />
          <Input label="Password" type="password" {...register('password')} {...noFillPassword} />
          <Input label="MPIN" type="password" {...register('mpin')} {...noFillPassword} />
        </>
      ) : null}

      {isCurrentOrCorp ? (
        <>
          <input type="text" name="fakeusernameremembered" className="hidden" autoComplete="username" tabIndex={-1} aria-hidden="true" />
          <input type="password" name="fakepasswordremembered" className="hidden" autoComplete="current-password" tabIndex={-1} aria-hidden="true" />
          <Input label="User ID" {...register('userId')} {...noFillText} />
          <Input label="Login ID" {...register('username')} {...noFillText} />
          <Input label="Customer ID" {...register('customerId')} {...noFillText} />
          <Input label="Group ID" {...register('groupId')} {...noFillText} />
          <Input label="Login Password" type="password" {...register('password')} {...noFillPassword} />
          <Input label="MPIN" type="password" {...register('mpin')} {...noFillPassword} />
          <Input label="Transaction Password" type="password" {...register('transactionPassword')} {...noFillPassword} />
          <Input label="Authoriser Password" type="password" {...register('authoriserPassword')} {...noFillPassword} />

          <SectionHeading icon={Users} title="3-user authorization" hint="Checker / Maker / Authoriser logins" />
          <Input label="Checker User ID" {...register('checkerUserId')} {...noFillText} />
          <Input label="Checker Password" type="password" {...register('checkerPassword')} {...noFillPassword} />
          <Input label="Maker User ID" {...register('makerUserId')} {...noFillText} />
          <Input label="Maker Password" type="password" {...register('makerPassword')} {...noFillPassword} />
          <Input label="Authoriser User ID" {...register('authoriserUserId')} {...noFillText} />
          <Input label="Authoriser User Password" type="password" {...register('authoriserUserPassword')} {...noFillPassword} />
        </>
      ) : null}

      <SectionHeading icon={CreditCard} title="Debit / ATM card" hint="Card linked to this account" />
      <Input label="Card Number" {...register('cardNumber')} />
      <Input label="Cardholder Name" {...register('cardHolderName')} />
      <Input label="Expiry (MM/YY)" placeholder="08/29" {...register('cardExpiry')} />
      <Input label="CVV" type="password" {...register('cardCvv')} />
      <Input label="ATM PIN" type="password" {...register('atmPin')} />

      <SectionHeading icon={Banknote} title="Limits & transactions" hint="Daily, monthly and usage caps" />
      <Input label="Daily Transaction Limit" type="number" {...register('dailyLimit')} />
      <Input label="Monthly Limit" type="number" {...register('monthlyLimit')} />
      <Input label="Current Usage" type="number" {...register('currentUsage')} />
      <Input label="Beneficiary Time Limit" placeholder="e.g. 30 minutes, 24 hours" {...register('beneficiaryTimeLimit')} />

      <SectionHeading icon={ShieldCheck} title="Status & classification" hint="Lifecycle, priority and tagging" />
      <Select label="Status" options={STATUSES} {...register('status')} />
      <Select label="Priority" options={PRIORITIES} {...register('priority')} />
      <Input label="Tags (comma separated)" {...register('tags')} />
      {showOwnershipSelectors && showAgentSelector ? (
        <Select label="Agent" {...register('agentId')}>
          <option value="">Unassigned</option>
          {agents.map((agent) => (
            <option key={agent.id} value={agent.id}>{agent.name}</option>
          ))}
        </Select>
      ) : null}
      {showOwnershipSelectors && showMerchantSelector ? (
        <Select label="Merchant" {...register('merchantId')}>
          <option value="">Unassigned</option>
          {merchants.map((merchant) => (
            <option key={merchant.id} value={merchant.id}>{merchant.name}</option>
          ))}
        </Select>
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
