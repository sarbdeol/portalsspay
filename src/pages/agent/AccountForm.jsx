import { Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BankAccountForm from '../../components/forms/BankAccountForm.jsx';
import Page from '../../components/Page.jsx';
import Card from '../../components/ui/Card.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import { useAccountMutations, unwrapError } from '../../hooks/useCrm.js';

export default function AccountForm() {
  const { notify } = useToast();
  const navigate = useNavigate();
  const { create } = useAccountMutations();

  const onSubmit = async (values) => {
    try {
      await create.mutateAsync(values);
      notify('Bank account saved');
      navigate('/agent/accounts');
    } catch (err) {
      notify(unwrapError(err), 'error');
    }
  };

  return (
    <Page title="Add Bank Account" eyebrow="Agent account management">
      <Card>
        <div className="mb-5 flex items-center gap-2 text-sm font-bold text-teal-700 dark:text-teal-300">
          <Save size={17} /> Create and store a working account record
        </div>
        <BankAccountForm
          onSubmit={onSubmit}
          submitLabel="Save Account"
          showContactSection={false}
          showOwnershipSelectors={false}
        />
      </Card>
    </Page>
  );
}
