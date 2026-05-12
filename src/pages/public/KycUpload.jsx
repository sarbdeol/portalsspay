import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CloudUpload, FileText, Download, Loader2, ShieldCheck } from 'lucide-react';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import { crmApi, unwrapError } from '../../services/crmApi.js';

function formatDate(value) {
  if (!value) return '';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

export default function KycUpload() {
  const { token } = useParams();
  const { notify } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [account, setAccount] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [label, setLabel] = useState('');
  const [uploader, setUploader] = useState('');
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  const refresh = async () => {
    try {
      const data = await crmApi.getKycPublic(token);
      setAccount(data.account);
      setDocuments(data.documents || []);
      setError('');
    } catch (err) {
      setError(unwrapError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleFiles = async (files) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const file of files) {
        await crmApi.uploadKycDocument(token, file, { label, uploadedBy: uploader });
      }
      notify('Documents uploaded', 'success');
      setLabel('');
      await refresh();
    } catch (err) {
      notify(unwrapError(err), 'error');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center text-slate-500">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid min-h-screen place-items-center px-6 text-center">
        <div className="glass max-w-md rounded-3xl p-8">
          <p className="text-lg font-bold text-rose-600">KYC link is invalid</p>
          <p className="mt-2 text-sm text-slate-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900 dark:bg-slate-950 dark:text-white">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="glass rounded-3xl p-6">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-teal-500 text-white">
              <ShieldCheck size={22} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">KYC Upload</p>
              <h1 className="text-2xl font-bold">{account.bank_name}</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {account.holder_name} • A/C •••• {account.account_number_last4 || '----'} • {account.status}
              </p>
            </div>
          </div>
        </header>

        <section className="glass rounded-3xl p-6">
          <h2 className="text-lg font-bold">Upload documents</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            PDF, JPG, PNG, DOC accepted • up to 15 MB each.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <Input label="Your Name (optional)" value={uploader} onChange={(e) => setUploader(e.target.value)} />
            <Input label="Document Label (optional)" placeholder="e.g. PAN front" value={label} onChange={(e) => setLabel(e.target.value)} />
          </div>
          <label
            className="mt-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 bg-white/50 p-8 text-center text-sm font-semibold text-slate-500 transition hover:border-teal-400 hover:text-teal-600 dark:border-white/15 dark:bg-white/[0.04]"
          >
            <input
              ref={inputRef}
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.webp,.heic,.doc,.docx"
              className="hidden"
              onChange={(e) => handleFiles(Array.from(e.target.files || []))}
              disabled={uploading}
            />
            {uploading ? (
              <>
                <Loader2 className="animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <CloudUpload size={28} />
                Click to choose files or drop them here
              </>
            )}
          </label>
        </section>

        <section className="glass rounded-3xl p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Uploaded documents</h2>
            <span className="text-xs font-semibold text-slate-400">{documents.length} file{documents.length === 1 ? '' : 's'}</span>
          </div>
          {documents.length === 0 ? (
            <p className="mt-4 rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-400 dark:border-white/10">
              Nothing uploaded yet.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-slate-200/70 dark:divide-white/10">
              {documents.map((doc) => (
                <li key={doc.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="flex items-start gap-3">
                    <FileText size={18} className="mt-1 text-slate-400" />
                    <div>
                      <p className="font-semibold">{doc.label || doc.filename}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {doc.filename}{doc.uploaded_by ? ` • by ${doc.uploaded_by}` : ''} • {formatDate(doc.uploaded_at)}
                      </p>
                    </div>
                  </div>
                  {doc.file_url ? (
                    <a
                      href={doc.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-9 items-center gap-2 rounded-2xl bg-slate-900/5 px-3 text-xs font-bold text-slate-700 hover:bg-slate-900/10 dark:bg-white/10 dark:text-slate-200"
                    >
                      <Download size={14} /> View
                    </a>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
