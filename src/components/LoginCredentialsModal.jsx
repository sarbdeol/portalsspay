import { Check, Copy, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import Button from './ui/Button.jsx';
import Modal from './ui/Modal.jsx';
import { useToast } from './ui/Toast.jsx';

function Row({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/55 bg-white/70 p-3 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.05]">
      <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">{label}</span>
      <p className="mt-1 break-all text-sm font-semibold text-slate-800 dark:text-slate-100">{value || '—'}</p>
    </div>
  );
}

export default function LoginCredentialsModal({ open, credentials, onClose }) {
  const [copied, setCopied] = useState(false);
  const { notify } = useToast();

  if (!credentials) return null;

  const { username, password, loginUrl, title = 'Login Credentials', description } = credentials;

  const copyPayload = `Username: ${username}\nPassword: ${password}\nLogin URL: ${loginUrl}`;

  const copyAll = async () => {
    try {
      await navigator.clipboard.writeText(copyPayload);
      setCopied(true);
      notify('Login credentials copied', 'success');
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      notify('Unable to copy to clipboard', 'error');
    }
  };

  return (
    <Modal open={open} title={title} description={description} onClose={onClose}>
      <div className="grid gap-3">
        <Row label="Username" value={username} />
        <Row label="Password" value={password} />
        <Row label="Login URL" value={loginUrl} />
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <Button onClick={copyAll}>
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? 'Copied' : 'Copy Login'}
        </Button>
        {loginUrl ? (
          <a
            href={loginUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-900/5 dark:text-slate-200 dark:hover:bg-white/10"
          >
            <ExternalLink size={16} /> Open Login
          </a>
        ) : null}
        <Button variant="ghost" onClick={onClose} className="ml-auto">Close</Button>
      </div>
    </Modal>
  );
}
