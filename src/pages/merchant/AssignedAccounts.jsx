import { Download } from 'lucide-react';
import { useState } from 'react';
import AccountCredentialPanel from '../../components/AccountCredentialPanel.jsx';
import BankAccountViewModal from '../../components/BankAccountViewModal.jsx';
import DataTable from '../../components/DataTable.jsx';
import Page from '../../components/Page.jsx';
import CopyButton from '../../components/CopyButton.jsx';
import { useAccounts, unwrapError } from '../../hooks/useCrm.js';
import { downloadAccountExcel } from '../../utils/accountExport.js';

export default function AssignedAccounts() {
  const { data: rows = [], isLoading, isError, error } = useAccounts({ mine: 'true' });
  const [viewAccount, setViewAccount] = useState(null);

  return (
    <Page title="Assigned Accounts" eyebrow="Merchant read-only vault">
      {isLoading ? (
        <div className="surface rounded-3xl p-10 text-center text-sm font-semibold text-slate-500">Loading accounts...</div>
      ) : isError ? (
        <div className="surface rounded-3xl p-10 text-center text-sm font-semibold text-rose-600">{unwrapError(error)}</div>
      ) : (
        <>
          <DataTable
            rows={rows}
            columns={[
              {
                key: 'bankCode',
                label: 'Bank ID',
                render: (row) => (
                  <span className="inline-flex items-center rounded-xl bg-slate-900/5 px-2.5 py-1 font-mono text-xs font-bold tracking-wider text-slate-700 dark:bg-white/10 dark:text-slate-200">
                    {row.bankCode}
                  </span>
                ),
              },
              { key: 'bankName', label: 'Bank' },
              { key: 'accountType', label: 'Type' },
              { key: 'holderName', label: 'Holder' },
              {
                key: 'accountNumber',
                label: 'Account',
                render: (row) => (
                  <div className="flex items-center gap-2">
                    {row.accountNumber}
                    <CopyButton value={row.accountNumber} label="Account Number" />
                  </div>
                ),
              },
              { key: 'ifsc', label: 'IFSC' },
              {
                key: 'upiId',
                label: 'UPI ID',
                render: (row) => (
                  <div className="flex items-center gap-2">
                    {row.upiId}
                    <CopyButton value={row.upiId} label="UPI ID" />
                  </div>
                ),
              },
              { key: 'status', label: 'Status' },
            ]}
            filters={['Bank Name', 'UPI App', 'Status', 'Tags']}
            onView={(account) => setViewAccount(account)}
            onRowAction={(account) => downloadAccountExcel(account)}
            rowAction={{ label: 'Excel', icon: <Download size={14} /> }}
          />
          <div className="grid gap-4 xl:grid-cols-2">
            {rows.map((account) => (
              <AccountCredentialPanel key={account.id} account={account} readOnly />
            ))}
          </div>
        </>
      )}
      <BankAccountViewModal
        open={Boolean(viewAccount)}
        account={viewAccount}
        onClose={() => setViewAccount(null)}
        readOnly
      />
    </Page>
  );
}
