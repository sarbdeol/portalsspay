import { Plus } from 'lucide-react';
import { useState } from 'react';
import MerchantForm from '../../components/forms/MerchantForm.jsx';
import DataTable from '../../components/DataTable.jsx';
import Page from '../../components/Page.jsx';
import Button from '../../components/ui/Button.jsx';
import Modal from '../../components/ui/Modal.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import { useAgents, useMerchants, useMerchantMutations, unwrapError } from '../../hooks/useCrm.js';

export default function Merchants() {
  const { notify } = useToast();
  const [modal, setModal] = useState({ open: false, merchant: null });
  const { data: agents = [] } = useAgents();
  const { data: merchants = [], isLoading, isError, error } = useMerchants();
  const { create, update, remove, toggle } = useMerchantMutations();

  const columns = [
    { key: 'name', label: 'Merchant' },
    { key: 'email', label: 'Email' },
    { key: 'agent', label: 'Assigned Agent' },
    { key: 'city', label: 'City' },
    { key: 'volume', label: 'Volume' },
    { key: 'status', label: 'Status' },
  ];

  const saveMerchant = async (values) => {
    try {
      if (modal.merchant) {
        await update.mutateAsync({ id: modal.merchant.id, values });
        notify('Merchant updated');
      } else {
        await create.mutateAsync(values);
        notify('Merchant created');
      }
      setModal({ open: false, merchant: null });
    } catch (err) {
      notify(unwrapError(err), 'error');
    }
  };

  const onToggle = async (merchant) => {
    try {
      await toggle.mutateAsync(merchant.id);
      notify('Merchant status updated');
    } catch (err) {
      notify(unwrapError(err), 'error');
    }
  };

  const onDelete = async (merchant) => {
    try {
      await remove.mutateAsync(merchant.id);
      notify('Merchant deleted');
    } catch (err) {
      notify(unwrapError(err), 'error');
    }
  };

  return (
    <>
      <Page
        title="Merchants"
        eyebrow="Assignments"
        actions={
          <Button onClick={() => setModal({ open: true, merchant: null })}>
            <Plus size={16} /> Create Merchant
          </Button>
        }
      >
        {isLoading ? (
          <div className="surface rounded-3xl p-10 text-center text-sm font-semibold text-slate-500">Loading merchants...</div>
        ) : isError ? (
          <div className="surface rounded-3xl p-10 text-center text-sm font-semibold text-rose-600">
            {unwrapError(error)}
          </div>
        ) : (
          <DataTable
            rows={merchants}
            columns={columns}
            filters={['Agent', 'Status', 'City']}
            exportName="merchants"
            onEdit={(merchant) => setModal({ open: true, merchant })}
            onToggleStatus={onToggle}
            onDelete={onDelete}
          />
        )}
      </Page>
      <Modal
        open={modal.open}
        title={modal.merchant ? 'Edit Merchant' : 'Create Merchant'}
        description="Assign agents and maintain merchant details."
        onClose={() => setModal({ open: false, merchant: null })}
      >
        <MerchantForm
          agents={agents}
          initialValues={modal.merchant}
          onSubmit={saveMerchant}
          submitLabel={modal.merchant ? 'Update Merchant' : 'Create Merchant'}
        />
      </Modal>
    </>
  );
}
