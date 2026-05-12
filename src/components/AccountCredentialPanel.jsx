import { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, ExternalLink, FileText, ShieldCheck, Trash2 } from 'lucide-react';
import CopyButton from './CopyButton.jsx';
import StatusBadge from './StatusBadge.jsx';
import { useAccountMutations, unwrapError } from '../hooks/useCrm.js';
import { useToast } from './ui/Toast.jsx';

const SENSITIVE = new Set(['Password', 'Transaction Password', 'MPIN', 'TPIN']);

function maskValue(value, hidden) {
  if (!value) return '—';
  if (!hidden) return value;
  return '•'.repeat(Math.min(12, String(value).length));
}

function Field({ label, value, readOnly, alwaysMask }) {
  const [hidden, setHidden] = useState(true);
  const isSecret = alwaysMask || SENSITIVE.has(label);
  const display = isSecret ? maskValue(value, hidden) : value || '—';
  return (
    <div className="rounded-2xl border border-white/55 bg-white/70 p-3 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.05]">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">{label}</span>
        <div className="flex items-center gap-1">
          {isSecret && !readOnly ? (
            <button
              type="button"
              onClick={() => setHidden((value) => !value)}
              className="rounded-lg p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white"
              title={hidden ? 'Reveal' : 'Hide'}
            >
              {hidden ? <Eye size={14} /> : <EyeOff size={14} />}
            </button>
          ) : null}
          <CopyButton value={value || ''} label={label} />
        </div>
      </div>
      <p className="mt-2 truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{display}</p>
    </div>
  );
}

export default function AccountCredentialPanel({ account, readOnly = false }) {
  const { notify } = useToast();
  const { deleteKyc } = useAccountMutations();
  const monthlyLimit = Number(account.monthlyLimit) || 0;
  const usage = Number(account.currentUsage) || 0;
  const percent = monthlyLimit ? Math.min(100, (usage / monthlyLimit) * 100) : 0;
  const remaining = Math.max(0, monthlyLimit - usage);

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

  const fullCredentials = [
    `Bank: ${account.bankName}`,
    `Holder: ${account.holderName}`,
    `Account: ${account.accountNumber}`,
    `IFSC: ${account.ifsc}`,
    `Branch: ${account.branch || ''}`,
    `UPI ID: ${account.upiId}`,
    `UPI App: ${account.upiApp || ''}`,
    `Customer ID: ${account.customerId || ''}`,
    `User ID: ${account.userId || ''}`,
    `Username: ${account.username || ''}`,
    `Password: ${account.password || ''}`,
    `Transaction Password: ${account.transactionPassword || ''}`,
    `MPIN: ${account.mpin || ''}`,
    `TPIN: ${account.tpin || ''}`,
    `Daily Limit: ₹${(Number(account.dailyLimit) || 0).toLocaleString('en-IN')}`,
    `Monthly Limit: ₹${monthlyLimit.toLocaleString('en-IN')}`,
    `Login URL: ${account.loginUrl || ''}`,
  ].join('\n');

  const fields = [
    ['Account Number', account.accountNumber],
    ['IFSC Code', account.ifsc],
    ['UPI ID', account.upiId],
    ['Customer ID', account.customerId],
    ['User ID', account.userId],
    ['Username', account.username],
    ['Password', account.password],
    ['Transaction Password', account.transactionPassword],
    ['MPIN', account.mpin],
    ['TPIN', account.tpin],
  ];

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.35 }}
      className="surface rounded-3xl p-5 shadow-ios"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-xl bg-slate-900/5 px-2.5 py-1 font-mono text-xs font-bold tracking-wider text-slate-700 dark:bg-white/10 dark:text-slate-200">
              {account.bankCode || `BNK-${String(account.id).padStart(4, '0')}`}
            </span>
            <h3 className="text-lg font-bold text-slate-950 dark:text-white">{account.bankName}</h3>
            <StatusBadge status={account.status} />
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {account.holderName} • {account.branch || account.accountType}
          </p>
          {account.tags?.length ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {account.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-slate-900/5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-600 dark:bg-white/10 dark:text-slate-300">
                  #{tag}
                </span>
              ))}
            </div>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {account.loginUrl ? (
            <a
              href={account.loginUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 items-center gap-2 rounded-2xl bg-white/75 px-3 text-xs font-bold text-slate-700 shadow-sm hover:text-teal-700 dark:bg-white/10 dark:text-slate-200"
              title="Open net banking"
            >
              <ExternalLink size={14} /> Login
            </a>
          ) : null}
          <CopyButton value={account.loginUrl || ''} label="Login URL" />
          {account.kycUrl ? (
            <>
              <a
                href={account.kycUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-10 items-center gap-2 rounded-2xl bg-white/75 px-3 text-xs font-bold text-slate-700 shadow-sm hover:text-teal-700 dark:bg-white/10 dark:text-slate-200"
                title="Open KYC upload page"
              >
                <ShieldCheck size={14} /> KYC
              </a>
              <CopyButton value={account.kycUrl} label="KYC Link" />
            </>
          ) : null}
          <CopyButton value={fullCredentials} label="Full Credentials" full />
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {fields.map(([label, value]) => (
          <Field key={label} label={label} value={value} readOnly={readOnly} alwaysMask={readOnly && SENSITIVE.has(label)} />
        ))}
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
          <span>Monthly usage</span>
          <span>{percent.toFixed(0)}%</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-slate-200/70 dark:bg-white/10">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percent}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-400"
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
          <span>Used ₹{usage.toLocaleString('en-IN')}</span>
          <span>Remaining ₹{remaining.toLocaleString('en-IN')}</span>
        </div>
      </div>

      {account.kycUrl ? (
        <div className="mt-5 rounded-2xl border border-white/55 bg-white/60 p-4 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-100">
              <ShieldCheck size={16} /> KYC documents
            </div>
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
              {account.kycDocuments?.length || 0} uploaded
            </span>
          </div>
          {account.kycDocuments?.length ? (
            <ul className="mt-3 divide-y divide-slate-200/70 dark:divide-white/10">
              {account.kycDocuments.map((doc) => (
                <li key={doc.id} className="flex items-center justify-between gap-3 py-2">
                  <div className="flex min-w-0 items-start gap-2">
                    <FileText size={14} className="mt-1 shrink-0 text-slate-400" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-700 dark:text-slate-200">{doc.label || doc.filename}</p>
                      <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                        {doc.filename}{doc.uploaded_by ? ` • ${doc.uploaded_by}` : ''}
                      </p>
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
          ) : (
            <p className="mt-3 text-xs text-slate-400">No documents uploaded yet. Share the KYC link to collect them.</p>
          )}
        </div>
      ) : null}
    </motion.article>
  );
}
