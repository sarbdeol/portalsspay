import { Landmark, WalletCards } from 'lucide-react';
import AccountCredentialPanel from '../../components/AccountCredentialPanel.jsx';
import Page from '../../components/Page.jsx';
import StatCard from '../../components/StatCard.jsx';
import { useAccounts, unwrapError } from '../../hooks/useCrm.js';
import { useAuthStore } from '../../store/authStore.js';

export default function AgentDashboard() {
  const { user } = useAuthStore();
  const { data: myAccounts = [], isLoading, isError, error } = useAccounts({ mine: 'true' });

  const upi = myAccounts.filter((account) => Boolean(account.upiId)).length;

  return (
    <Page title="Agent Workspace" eyebrow={user?.name || 'Agent'}>
      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="My Accounts" value={myAccounts.length} helper="Editable bank records" icon={Landmark} />
        <StatCard label="UPI Details" value={upi} helper="UPI-linked accounts" icon={WalletCards} />
      </div>
      {isLoading ? (
        <div className="surface rounded-3xl p-10 text-center text-sm font-semibold text-slate-500">Loading your accounts...</div>
      ) : isError ? (
        <div className="surface rounded-3xl p-10 text-center text-sm font-semibold text-rose-600">{unwrapError(error)}</div>
      ) : myAccounts.length === 0 ? (
        <div className="surface rounded-3xl p-10 text-center text-sm font-semibold text-slate-500">No accounts assigned to you yet.</div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {myAccounts.map((account) => (
            <AccountCredentialPanel key={account.id} account={account} />
          ))}
        </div>
      )}
    </Page>
  );
}
