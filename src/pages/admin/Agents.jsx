import { Plus } from 'lucide-react';
import { useState } from 'react';
import AgentForm from '../../components/forms/AgentForm.jsx';
import DataTable from '../../components/DataTable.jsx';
import LoginCredentialsModal from '../../components/LoginCredentialsModal.jsx';
import Page from '../../components/Page.jsx';
import Button from '../../components/ui/Button.jsx';
import Modal from '../../components/ui/Modal.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import { useAgents, useAgentMutations, unwrapError } from '../../hooks/useCrm.js';

export default function Agents() {
  const { notify } = useToast();
  const [modal, setModal] = useState({ open: false, agent: null });
  const [credentials, setCredentials] = useState(null);
  const { data: agents = [], isLoading, isError, error } = useAgents();
  const { create, update, remove, toggle } = useAgentMutations();

  const columns = [
    { key: 'name', label: 'Agent' },
    { key: 'username', label: 'Username' },
    { key: 'mobile', label: 'Mobile' },
    { key: 'merchants', label: 'Merchants' },
    { key: 'accounts', label: 'Accounts' },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
  ];

  const saveAgent = async (values) => {
    try {
      if (modal.agent) {
        await update.mutateAsync({ id: modal.agent.id, values });
        notify('Agent updated');
        setModal({ open: false, agent: null });
      } else {
        await create.mutateAsync(values);
        notify('Agent created');
        setModal({ open: false, agent: null });
        setCredentials({
          title: 'Agent Created',
          description: 'Share these credentials with the agent.',
          username: values.username,
          password: values.password,
          loginUrl: `${window.location.origin}/login`,
        });
      }
    } catch (err) {
      notify(unwrapError(err), 'error');
    }
  };

  const onToggle = async (agent) => {
    try {
      await toggle.mutateAsync(agent.id);
      notify('Agent status updated');
    } catch (err) {
      notify(unwrapError(err), 'error');
    }
  };

  const onDelete = async (agent) => {
    try {
      await remove.mutateAsync(agent.id);
      notify('Agent deleted');
    } catch (err) {
      notify(unwrapError(err), 'error');
    }
  };

  const onCopyLogin = (agent) => {
    if (!agent.lastPassword) {
      notify('No saved password yet — use Reset Password or edit the agent to set one.', 'error');
      return;
    }
    setCredentials({
      title: `Login for ${agent.name}`,
      description: 'Share these credentials.',
      username: agent.username || agent.email || agent.name,
      password: agent.lastPassword,
      loginUrl: `${window.location.origin}/login`,
    });
  };

  return (
    <>
      <Page
        title="Agents"
        eyebrow="Admin control"
        actions={
          <Button onClick={() => setModal({ open: true, agent: null })}>
            <Plus size={16} /> Create Agent
          </Button>
        }
      >
        {isLoading ? (
          <div className="surface rounded-3xl p-10 text-center text-sm font-semibold text-slate-500">Loading agents...</div>
        ) : isError ? (
          <div className="surface rounded-3xl p-10 text-center text-sm font-semibold text-rose-600">
            {unwrapError(error)}
          </div>
        ) : (
          <DataTable
            rows={agents}
            columns={columns}
            filters={['Status', 'Date', 'Region']}
            exportName="agents"
            onEdit={(agent) => setModal({ open: true, agent })}
            onToggleStatus={onToggle}
            onDelete={onDelete}
            onCopyLogin={onCopyLogin}
          />
        )}
      </Page>
      <Modal
        open={modal.open}
        title={modal.agent ? 'Edit Agent' : 'Create Agent'}
        description={modal.agent ? 'Manage profile, contact, and operational notes.' : 'Enter username and password to provision a new agent.'}
        onClose={() => setModal({ open: false, agent: null })}
      >
        <AgentForm
          initialValues={modal.agent}
          onSubmit={saveAgent}
          submitLabel={modal.agent ? 'Update Agent' : 'Create Agent'}
        />
      </Modal>
      <LoginCredentialsModal
        open={Boolean(credentials)}
        credentials={credentials}
        onClose={() => setCredentials(null)}
      />
    </>
  );
}
