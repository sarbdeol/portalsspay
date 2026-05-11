import DataTable from '../../components/DataTable.jsx';
import Page from '../../components/Page.jsx';
import { useAgents, unwrapError } from '../../hooks/useCrm.js';

export default function AssignedAgents() {
  const { data: rows = [], isLoading, isError, error } = useAgents({ mine: 'true' });

  return (
    <Page title="Assigned Agents" eyebrow="Support contacts">
      {isLoading ? (
        <div className="surface rounded-3xl p-10 text-center text-sm font-semibold text-slate-500">Loading agent...</div>
      ) : isError ? (
        <div className="surface rounded-3xl p-10 text-center text-sm font-semibold text-rose-600">{unwrapError(error)}</div>
      ) : (
        <DataTable
          readOnly
          rows={rows}
          columns={[
            { key: 'name', label: 'Agent' },
            { key: 'mobile', label: 'Mobile Number' },
            { key: 'whatsapp', label: 'WhatsApp Number' },
            { key: 'telegram', label: 'Telegram Username' },
            { key: 'email', label: 'Email' },
            { key: 'status', label: 'Status' },
          ]}
        />
      )}
    </Page>
  );
}
