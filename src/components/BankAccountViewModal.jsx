import { Download, ExternalLink, FileText, ShieldCheck, Trash2 } from 'lucide-react';
import Button from './ui/Button.jsx';
import CopyButton from './CopyButton.jsx';
import Modal from './ui/Modal.jsx';
import StatusBadge from './StatusBadge.jsx';
import { downloadAccountExcel } from '../utils/accountExport.js';
import { useAccountMutations, unwrapError } from '../hooks/useCrm.js';
import { useToast } from './ui/Toast.jsx';

function Row({ label, value, sensitive }) {
  if (value === '' || value === null || value === undefined) return null;
  return (
    <div className="rounded-2xl border border-white/55 bg-white/70 p-3 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.05]">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">{label}</span>
        <CopyButton value={String(value)} label={label} />
      </div>
      <p className={`mt-1 break-all text-sm font-semibold text-slate-800 dark:text-slate-100 ${sensitive ? 'font-mono' : ''}`}>
        {String(value)}
      </p>
    </div>
  );
}

function Section({ title, children }) {
  const items = Array.isArray(children) ? children.filter(Boolean) : [children].filter(Boolean);
  const hasContent = items.some((node) => node && (node.props?.value !== '' && node.props?.value !== null && node.props?.value !== undefined));
  if (!hasContent) return null;
  return (
    <div className="mt-4">
      <h4 className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{title}</h4>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{children}</div>
    </div>
  );
}

export default function BankAccountViewModal({ open, account, onClose, readOnly = false }) {
  const { notify } = useToast();
  const { deleteKyc } = useAccountMutations();
  if (!account) return null;

  const onDeleteKyc = async (doc) => {
    const label = doc.label || doc.filename || `document #${doc.id}`;
    if (!window.confirm(`Delete "${label}"? This permanently removes the file.`)) return;
    try {
      await deleteKyc.mutateAsync(doc.id);
      notify('Document deleted', 'success');
    } catch (err) {
      notify(unwrapError(err), 'error');
    }
  };

  return (
    <Modal
      open={open}
      title={`${account.bankCode || `#${account.id}`} • ${account.bankName}`}
      description={`${account.accountType || ''} • ${account.holderName || account.companyName || ''}`}
      onClose={onClose}
    >
      <div className="flex flex-wrap items-center gap-2 pb-3">
        <StatusBadge status={account.status} />
        <span className="inline-flex items-center rounded-xl bg-slate-900/5 px-2.5 py-1 font-mono text-xs font-bold tracking-wider text-slate-700 dark:bg-white/10 dark:text-slate-200">
          {account.bankCode || `BNK-${String(account.id).padStart(4, '0')}`}
        </span>
        <span className="rounded-full bg-slate-900/5 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-600 dark:bg-white/10 dark:text-slate-300">
          {account.priority || 'Medium'}
        </span>
        <div className="ml-auto flex flex-wrap gap-2">
          {account.loginUrl ? (
            <a
              href={account.loginUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 items-center gap-2 rounded-2xl bg-white/75 px-3 text-xs font-bold text-slate-700 shadow-sm hover:text-teal-700 dark:bg-white/10 dark:text-slate-200"
            >
              <ExternalLink size={14} /> Bank Login
            </a>
          ) : null}
          {account.kycUrl ? (
            <>
              <a
                href={account.kycUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-9 items-center gap-2 rounded-2xl bg-white/75 px-3 text-xs font-bold text-slate-700 shadow-sm hover:text-teal-700 dark:bg-white/10 dark:text-slate-200"
              >
                <ShieldCheck size={14} /> KYC
              </a>
              <CopyButton value={account.kycUrl} label="KYC Link" />
            </>
          ) : null}
          <Button onClick={() => downloadAccountExcel(account)} className="h-9 px-3">
            <Download size={14} /> Excel
          </Button>
        </div>
      </div>

      <Section title="Basic">
        <Row label="Bank" value={account.bankName} />
        <Row label="Account Type" value={account.accountType} />
        <Row label="Account Number" value={account.accountNumber} sensitive />
        <Row label="IFSC" value={account.ifsc} sensitive />
        <Row label="Branch" value={account.branch} />
        <Row label="Holder Name" value={account.holderName} />
        <Row label="Bank Email" value={account.bankEmail} />
      </Section>

      <Section title="Corporate">
        <Row label="Company Name" value={account.companyName} />
        <Row label="Authorized Signatory" value={account.authorizedSignatory} />
        <Row label="Company PAN" value={account.companyPan} />
        <Row label="GST Number" value={account.gstNumber} />
      </Section>

      <Section title="UPI">
        <Row label="UPI ID" value={account.upiId} />
        <Row label="UPI App" value={account.upiApp} />
        <Row label="UPI Mobile" value={account.upiMobile} />
      </Section>

      <Section title="Net Banking Credentials">
        <Row label="User ID" value={account.userId} />
        <Row label="Login ID" value={account.username} />
        <Row label="Customer ID" value={account.customerId} />
        <Row label="Group ID" value={account.groupId} />
        <Row label="Login Password" value={account.password} sensitive />
        <Row label="MPIN" value={account.mpin} sensitive />
        <Row label="Transaction Password" value={account.transactionPassword} sensitive />
        <Row label="Authoriser Password" value={account.authoriserPassword} sensitive />
        <Row label="TPIN" value={account.tpin} sensitive />
      </Section>

      <Section title="3-User Authorization">
        <Row label="Checker User ID" value={account.checkerUserId} />
        <Row label="Checker Password" value={account.checkerPassword} sensitive />
        <Row label="Maker User ID" value={account.makerUserId} />
        <Row label="Maker Password" value={account.makerPassword} sensitive />
        <Row label="Authoriser User ID" value={account.authoriserUserId} />
        <Row label="Authoriser User Password" value={account.authoriserUserPassword} sensitive />
      </Section>

      <Section title="Debit / ATM Card">
        <Row label="Card Number" value={account.cardNumber} sensitive />
        <Row label="Cardholder" value={account.cardHolderName} />
        <Row label="Expiry" value={account.cardExpiry} />
        <Row label="CVV" value={account.cardCvv} sensitive />
        <Row label="ATM PIN" value={account.atmPin} sensitive />
      </Section>

      <Section title="Limits">
        <Row label="Daily Limit" value={account.dailyLimit?.toLocaleString('en-IN')} />
        <Row label="Monthly Limit" value={account.monthlyLimit?.toLocaleString('en-IN')} />
        <Row label="Current Usage" value={account.currentUsage?.toLocaleString('en-IN')} />
        <Row label="Beneficiary Time Limit" value={account.beneficiaryTimeLimit} />
      </Section>

      <Section title="Assignment">
        {readOnly ? null : <Row label="Agent" value={account.agent} />}
        <Row label="Merchant" value={account.merchant} />
        <Row label="Status" value={account.status} />
        <Row label="Priority" value={account.priority} />
        <Row label="Added" value={account.addedDate} />
      </Section>

      <Section title="Contact / Recovery">
        <Row label="Registered Mobile" value={account.registeredMobile} />
        <Row label="Recovery Email" value={account.recoveryEmail} />
        <Row label="WhatsApp" value={account.whatsapp} />
      </Section>

      <Section title="Links">
        <Row label="Net Banking URL" value={account.loginUrl} />
        <Row label="KYC URL" value={account.kycUrl} />
      </Section>

      {account.notes ? (
        <div className="mt-4 rounded-2xl border border-white/55 bg-white/70 p-3 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.05]">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Notes</p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200">{account.notes}</p>
        </div>
      ) : null}

      {account.kycDocuments?.length ? (
        <div className="mt-5 rounded-2xl border border-white/55 bg-white/70 p-4 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.05]">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} />
            <h4 className="text-sm font-bold">KYC documents</h4>
            <span className="ml-auto text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
              {account.kycDocuments.length} uploaded
            </span>
          </div>
          <ul className="mt-3 divide-y divide-slate-200/70 dark:divide-white/10">
            {account.kycDocuments.map((doc) => (
              <li key={doc.id} className="flex items-center justify-between gap-3 py-2">
                <div className="flex items-start gap-2">
                  <FileText size={14} className="mt-1 text-slate-400" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{doc.label || doc.filename}</p>
                    <p className="truncate text-[11px] text-slate-500">{doc.filename}{doc.uploaded_by ? ` • ${doc.uploaded_by}` : ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {doc.file_url ? (
                    <a
                      href={doc.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-8 items-center gap-1 rounded-xl bg-slate-900/5 px-2 text-[11px] font-bold text-slate-700 hover:bg-slate-900/10 dark:bg-white/10 dark:text-slate-200"
                    >
                      View
                    </a>
                  ) : null}
                  {!readOnly ? (
                    <button
                      type="button"
                      onClick={() => onDeleteKyc(doc)}
                      title="Delete document"
                      disabled={deleteKyc.isPending}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-rose-600 hover:bg-rose-500/10 disabled:opacity-50"
                    >
                      <Trash2 size={14} />
                    </button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </Modal>
  );
}
