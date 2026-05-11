import { Landmark, ShieldCheck, UsersRound } from 'lucide-react';
import AccountCredentialPanel from '../../components/AccountCredentialPanel.jsx';
import Page from '../../components/Page.jsx';
import StatCard from '../../components/StatCard.jsx';
import { useAccounts, useAgents, unwrapError } from '../../hooks/useCrm.js';

export default function MerchantDashboard() {
  const { data: assigned = [], isLoading, isError, error } = useAccounts({ mine: 'true' });
  const { data: assignedAgents = [] } = useAgents({ mine: 'true' });
  const active = assigned.filter((account) => account.status === 'Active').length;

  return (
    <Page title="Merchant Dashboard" eyebrow="Read-only account access">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Assigned Accounts" value={assigned.length} helper={`${active} active`} icon={Landmark} />
        <StatCard label="Active Vault" value={active} helper="Available right now" icon={ShieldCheck} />
        <StatCard label="Assigned Agents" value={assignedAgents.length} helper="Direct support" icon={UsersRound} />
      </div>
      {isLoading ? (
        <div className="surface rounded-3xl p-10 text-center text-sm font-semibold text-slate-500">Loading your accounts...</div>
      ) : isError ? (
        <div className="surface rounded-3xl p-10 text-center text-sm font-semibold text-rose-600">{unwrapError(error)}</div>
      ) : assigned.length === 0 ? (
        <div className="surface rounded-3xl p-10 text-center text-sm font-semibold text-slate-500">No accounts assigned yet.</div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {assigned.map((account) => (
            <AccountCredentialPanel key={account.id} account={account} readOnly />
          ))}
        </div>
      )}
    </Page>
  );
}
