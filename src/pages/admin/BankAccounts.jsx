import { Download, Plus, UserCheck } from 'lucide-react';
import { useMemo, useState } from 'react';
import BankAccountForm from '../../components/forms/BankAccountForm.jsx';
import BankAccountViewModal from '../../components/BankAccountViewModal.jsx';
import DataTable from '../../components/DataTable.jsx';
import Page from '../../components/Page.jsx';
import Button from '../../components/ui/Button.jsx';
import Modal from '../../components/ui/Modal.jsx';
import CopyButton from '../../components/CopyButton.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import { useAccounts, useAccountMutations, useAgents, useMerchants, unwrapError } from '../../hooks/useCrm.js';
import { bankAccountExportFields, downloadAccountExcel, downloadBankAccountsPdf } from '../../utils/accountExport.js';

export default function BankAccounts({ scope = 'admin' }) {
  const { notify } = useToast();
  const [modal, setModal] = useState({ open: false, account: null });
  const [viewAccount, setViewAccount] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [merchantFilter, setMerchantFilter] = useState('');
  const [assignModal, setAssignModal] = useState({ open: false, merchantId: '' });
  const [assigning, setAssigning] = useState(false);
  const params = scope === 'agent' ? { mine: 'true' } : undefined;
  const { data: rows = [], isLoading, isError, error } = useAccounts(params);
  const { data: agents = [] } = useAgents();
  const { data: merchants = [] } = useMerchants();
  const { create, update, remove, toggle } = useAccountMutations();

  const filteredRows = useMemo(() => {
    if (!merchantFilter) return rows;
    if (merchantFilter === '__unassigned__') return rows.filter((row) => !row.merchantId);
    return rows.filter((row) => String(row.merchantId) === String(merchantFilter));
  }, [rows, merchantFilter]);

  const formatBankId = (id) => `BNK-${String(id).padStart(4, '0')}`;

  const columns = [
    {
      key: 'bankCode',
      label: 'Bank ID',
      render: (row) => (
        <span className="inline-flex items-center rounded-xl bg-slate-900/5 px-2.5 py-1 font-mono text-xs font-bold tracking-wider text-slate-700 dark:bg-white/10 dark:text-slate-200">
          {formatBankId(row.id)}
        </span>
      ),
    },
    { key: 'bankName', label: 'Bank' },
    { key: 'accountType', label: 'Type' },
    {
      key: 'accountNumber',
      label: 'Account No.',
      render: (row) => (
        <div className="flex items-center gap-2">
          <span>{row.accountNumber}</span>
          <CopyButton value={row.accountNumber} label="Account Number" />
        </div>
      ),
    },
    {
      key: 'ifsc',
      label: 'IFSC',
      render: (row) => (
        <div className="flex items-center gap-2">
          <span>{row.ifsc}</span>
          <CopyButton value={row.ifsc} label="IFSC Code" />
        </div>
      ),
    },
    { key: 'agent', label: 'Agent', exportable: false },
    {
      key: 'merchant',
      label: 'Merchant',
      render: (row) => row.merchant ? (
        <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
          {row.merchant}
        </span>
      ) : (
        <span className="text-xs text-slate-400">Unassigned</span>
      ),
    },
    { key: 'status', label: 'Status' },
  ];

  const saveAccount = async (values) => {
    try {
      if (modal.account) {
        await update.mutateAsync({ id: modal.account.id, values });
        notify('Bank account updated');
      } else {
        await create.mutateAsync(values);
        notify('Bank account created');
      }
      setModal({ open: false, account: null });
    } catch (err) {
      notify(unwrapError(err), 'error');
    }
  };

  const onToggle = async (account) => {
    try {
      await toggle.mutateAsync(account.id);
      notify('Account status updated');
    } catch (err) {
      notify(unwrapError(err), 'error');
    }
  };

  const onDelete = async (account) => {
    try {
      await remove.mutateAsync(account.id);
      notify('Bank account deleted');
    } catch (err) {
      notify(unwrapError(err), 'error');
    }
  };

  const runBulkAssign = async () => {
    if (!selectedIds.length) {
      notify('No bank accounts selected', 'error');
      return;
    }
    const merchantId = assignModal.merchantId || null;
    setAssigning(true);
    let ok = 0;
    let failed = 0;
    for (const id of selectedIds) {
      const account = rows.find((row) => row.id === id);
      if (!account) continue;
      try {
        await update.mutateAsync({
          id,
          values: { ...account, merchantId: merchantId ? String(merchantId) : '' },
        });
        ok += 1;
      } catch {
        failed += 1;
      }
    }
    setAssigning(false);
    setAssignModal({ open: false, merchantId: '' });
    setSelectedIds([]);
    if (failed) {
      notify(`${ok} updated, ${failed} failed`, failed === selectedIds.length ? 'error' : 'info');
    } else {
      const merchantName = merchants.find((m) => String(m.id) === String(merchantId))?.name || 'Unassigned';
      notify(`${ok} bank account${ok === 1 ? '' : 's'} → ${merchantName}`, 'success');
    }
  };

  return (
    <>
      <Page
        title={scope === 'agent' ? 'My Accounts' : 'Bank Accounts'}
        eyebrow="Indian banking + UPI vault"
        actions={
          <Button onClick={() => setModal({ open: true, account: null })}>
            <Plus size={16} /> Add Account
          </Button>
        }
      >
        {isLoading ? (
          <div className="surface rounded-3xl p-10 text-center text-sm font-semibold text-slate-500">Loading bank accounts...</div>
        ) : isError ? (
          <div className="surface rounded-3xl p-10 text-center text-sm font-semibold text-rose-600">
            {unwrapError(error)}
          </div>
        ) : (
          <>
            <div className="surface mb-4 flex flex-wrap items-center gap-3 rounded-2xl p-4">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
                Filter by merchant
                <select
                  value={merchantFilter}
                  onChange={(e) => setMerchantFilter(e.target.value)}
                  className="h-10 rounded-xl border border-white/70 bg-white/70 px-3 text-sm font-semibold text-slate-900 outline-none dark:border-white/10 dark:bg-white/[0.08] dark:text-white"
                >
                  <option value="">All accounts</option>
                  <option value="__unassigned__">Unassigned</option>
                  {merchants.map((merchant) => (
                    <option key={merchant.id} value={merchant.id}>{merchant.name}</option>
                  ))}
                </select>
              </label>
              <span className="text-xs text-slate-400">
                {filteredRows.length} of {rows.length} accounts
              </span>
            </div>

            <DataTable
              rows={filteredRows}
              columns={columns}
              filters={['Bank Name', 'UPI App', 'Status', 'Agent', 'Merchant', 'Date', 'Tags']}
              exportName="bank-accounts"
              exportFields={bankAccountExportFields}
              customPdf={(rows) => downloadBankAccountsPdf(rows, 'bank-accounts')}
              onRowClick={(account) => setViewAccount(account)}
              onView={(account) => setViewAccount(account)}
              onEdit={(account) => setModal({ open: true, account })}
              onToggleStatus={onToggle}
              onDelete={onDelete}
              onRowAction={(account) => downloadAccountExcel(account)}
              rowAction={{ label: 'Excel', icon: <Download size={14} /> }}
              selectable
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
              bulkBar={
                <Button onClick={() => setAssignModal({ open: true, merchantId: '' })} className="h-9 px-3">
                  <UserCheck size={14} /> Assign to merchant
                </Button>
              }
            />
          </>
        )}
      </Page>
      <Modal
        open={modal.open}
        title={modal.account ? `Edit Bank Account #${modal.account.id}` : 'Add Bank Account'}
        description="Manage Indian bank, UPI, limits, credentials, contacts, and login URL."
        onClose={() => setModal({ open: false, account: null })}
      >
        <BankAccountForm
          initialValues={modal.account}
          agents={agents}
          merchants={merchants}
          onSubmit={saveAccount}
          submitLabel={modal.account ? 'Update Account' : 'Create Account'}
          showAgentSelector={scope === 'admin' ? false : true}
        />
      </Modal>
      <Modal
        open={assignModal.open}
        title="Assign to merchant"
        description={`Reassign ${selectedIds.length} bank account${selectedIds.length === 1 ? '' : 's'}.`}
        onClose={() => setAssignModal({ open: false, merchantId: '' })}
      >
        <div className="grid gap-4">
          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Merchant</span>
            <select
              value={assignModal.merchantId}
              onChange={(e) => setAssignModal({ ...assignModal, merchantId: e.target.value })}
              className="h-13 w-full rounded-2xl border border-white/70 bg-white/70 px-4 text-sm font-semibold text-slate-900 outline-none dark:border-white/10 dark:bg-white/[0.08] dark:text-white"
            >
              <option value="">— Unassign (remove merchant) —</option>
              {merchants.map((merchant) => (
                <option key={merchant.id} value={merchant.id}>{merchant.name}</option>
              ))}
            </select>
          </label>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setAssignModal({ open: false, merchantId: '' })}>Cancel</Button>
            <Button onClick={runBulkAssign} disabled={assigning}>
              {assigning ? 'Assigning…' : `Assign ${selectedIds.length}`}
            </Button>
          </div>
        </div>
      </Modal>
      <BankAccountViewModal
        open={Boolean(viewAccount)}
        account={viewAccount}
        onClose={() => setViewAccount(null)}
      />
    </>
  );
}
