import AccountCredentialPanel from '../../components/AccountCredentialPanel.jsx';
import DataTable from '../../components/DataTable.jsx';
import Page from '../../components/Page.jsx';
import CopyButton from '../../components/CopyButton.jsx';
import { useAccounts, unwrapError } from '../../hooks/useCrm.js';

export default function AssignedAccounts() {
  const { data: rows = [], isLoading, isError, error } = useAccounts({ mine: 'true' });

  return (
    <Page title="Assigned Accounts" eyebrow="Merchant read-only vault">
      {isLoading ? (
        <div className="surface rounded-3xl p-10 text-center text-sm font-semibold text-slate-500">Loading accounts...</div>
      ) : isError ? (
        <div className="surface rounded-3xl p-10 text-center text-sm font-semibold text-rose-600">{unwrapError(error)}</div>
      ) : (
        <>
          <DataTable
            readOnly
            rows={rows}
            columns={[
              { key: 'bankName', label: 'Bank' },
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
          />
          <div className="grid gap-4 xl:grid-cols-2">
            {rows.map((account) => (
              <AccountCredentialPanel key={account.id} account={account} readOnly />
            ))}
          </div>
        </>
      )}
    </Page>
  );
}
