import { Download, Plus } from 'lucide-react';
import { useState } from 'react';
import AccountCredentialPanel from '../../components/AccountCredentialPanel.jsx';
import BankAccountForm from '../../components/forms/BankAccountForm.jsx';
import BankAccountViewModal from '../../components/BankAccountViewModal.jsx';
import DataTable from '../../components/DataTable.jsx';
import Page from '../../components/Page.jsx';
import Button from '../../components/ui/Button.jsx';
import Modal from '../../components/ui/Modal.jsx';
import CopyButton from '../../components/CopyButton.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import { useAccounts, useAccountMutations, useAgents, useMerchants, unwrapError } from '../../hooks/useCrm.js';
import { downloadAccountExcel } from '../../utils/accountExport.js';

export default function BankAccounts({ scope = 'admin' }) {
  const { notify } = useToast();
  const [modal, setModal] = useState({ open: false, account: null });
  const [viewAccount, setViewAccount] = useState(null);
  const params = scope === 'agent' ? { mine: 'true' } : undefined;
  const { data: rows = [], isLoading, isError, error } = useAccounts(params);
  const { data: agents = [] } = useAgents();
  const { data: merchants = [] } = useMerchants();
  const { create, update, remove, toggle } = useAccountMutations();

  const columns = [
    { key: 'bankName', label: 'Bank', render: (row) => <span className="font-bold">#{row.id} • {row.bankName}</span> },
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
    { key: 'merchant', label: 'Merchant' },
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
            <DataTable
              rows={rows}
              columns={columns}
              filters={['Bank Name', 'UPI App', 'Status', 'Agent', 'Merchant', 'Date', 'Tags']}
              exportName="bank-accounts"
              onView={(account) => setViewAccount(account)}
              onEdit={(account) => setModal({ open: true, account })}
              onToggleStatus={onToggle}
              onDelete={onDelete}
              onRowAction={(account) => downloadAccountExcel(account)}
              rowAction={{ label: 'Excel', icon: <Download size={14} /> }}
            />
            <div className="grid gap-4 xl:grid-cols-2">
              {rows.map((account) => (
                <AccountCredentialPanel key={account.id} account={account} />
              ))}
            </div>
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
      <BankAccountViewModal
        open={Boolean(viewAccount)}
        account={viewAccount}
        onClose={() => setViewAccount(null)}
      />
    </>
  );
}
