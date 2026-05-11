import { Landmark, Store, UsersRound, WalletCards } from 'lucide-react';
import AccountCredentialPanel from '../../components/AccountCredentialPanel.jsx';
import Page from '../../components/Page.jsx';
import StatCard from '../../components/StatCard.jsx';
import Card from '../../components/ui/Card.jsx';
import { useAccounts, useAgents, useMerchants, useActivityLogs } from '../../hooks/useCrm.js';

export default function AdminDashboard() {
  const { data: agents = [] } = useAgents();
  const { data: merchants = [] } = useMerchants();
  const { data: bankAccounts = [] } = useAccounts();
  const { data: activityLogs = [] } = useActivityLogs();

  const active = bankAccounts.filter((account) => account.status === 'Active').length;
  const disabled = bankAccounts.filter((account) => account.status === 'Disabled').length;
  const pending = bankAccounts.filter((account) => account.status === 'Pending').length;
  const upi = bankAccounts.filter((account) => Boolean(account.upiId)).length;

  return (
    <Page title="Command Center" eyebrow="Admin analytics">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Agents" value={agents.length} helper="Active field operators" icon={UsersRound} delay={0.02} />
        <StatCard label="Total Merchants" value={merchants.length} helper="Assigned merchant entities" icon={Store} delay={0.05} />
        <StatCard label="Bank Accounts" value={bankAccounts.length} helper={`${active} active • ${disabled} disabled`} icon={Landmark} delay={0.08} />
        <StatCard label="UPI Accounts" value={upi} helper={`${pending} pending review`} icon={WalletCards} delay={0.11} />
      </div>

      <Card>
        <h2 className="text-xl font-bold">Activity timeline</h2>
        <div className="mt-5 space-y-4">
          {activityLogs.length === 0 ? (
            <p className="text-sm font-medium text-slate-500">No activity yet.</p>
          ) : (
            activityLogs.slice(0, 8).map((log) => (
              <div key={log.id} className="flex gap-3">
                <div className="mt-1 h-3 w-3 rounded-full bg-teal-500 shadow-[0_0_0_6px_rgba(20,184,166,0.12)]" />
                <div>
                  <p className="text-sm font-bold">{log.action}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {log.actor} • {log.target} • {log.time}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {bankAccounts.length > 0 ? (
        <div>
          <h2 className="mb-4 text-xl font-bold">Recently added accounts</h2>
          <div className="grid gap-4 xl:grid-cols-2">
            {bankAccounts.slice(0, 2).map((account) => (
              <AccountCredentialPanel key={account.id} account={account} />
            ))}
          </div>
        </div>
      ) : null}
    </Page>
  );
}
