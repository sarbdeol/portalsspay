import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { crmApi, unwrapError } from '../services/crmApi.js';

/* ---------- Query keys ---------- */
export const queryKeys = {
  agents: (params) => ['agents', params || {}],
  merchants: (params) => ['merchants', params || {}],
  accounts: (params) => ['accounts', params || {}],
  activityLogs: () => ['activityLogs'],
  me: () => ['me'],
};

/* ---------- Agents ---------- */
export function useAgents(params) {
  return useQuery({
    queryKey: queryKeys.agents(params),
    queryFn: () => crmApi.listAgents(params),
  });
}

export function useAgentMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['agents'] });
    qc.invalidateQueries({ queryKey: ['activityLogs'] });
  };
  return {
    create: useMutation({ mutationFn: crmApi.createAgent, onSuccess: invalidate }),
    update: useMutation({ mutationFn: ({ id, values }) => crmApi.updateAgent(id, values), onSuccess: invalidate }),
    remove: useMutation({ mutationFn: crmApi.deleteAgent, onSuccess: invalidate }),
    toggle: useMutation({ mutationFn: crmApi.toggleAgent, onSuccess: invalidate }),
    resetPassword: useMutation({ mutationFn: ({ id, password }) => crmApi.resetAgentPassword(id, password), onSuccess: invalidate }),
  };
}

/* ---------- Merchants ---------- */
export function useMerchants(params) {
  return useQuery({
    queryKey: queryKeys.merchants(params),
    queryFn: () => crmApi.listMerchants(params),
  });
}

export function useMerchantMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['merchants'] });
    qc.invalidateQueries({ queryKey: ['activityLogs'] });
  };
  return {
    create: useMutation({ mutationFn: crmApi.createMerchant, onSuccess: invalidate }),
    update: useMutation({ mutationFn: ({ id, values }) => crmApi.updateMerchant(id, values), onSuccess: invalidate }),
    remove: useMutation({ mutationFn: crmApi.deleteMerchant, onSuccess: invalidate }),
    toggle: useMutation({ mutationFn: crmApi.toggleMerchant, onSuccess: invalidate }),
    resetPassword: useMutation({ mutationFn: ({ id, password }) => crmApi.resetMerchantPassword(id, password), onSuccess: invalidate }),
  };
}

/* ---------- Bank accounts ---------- */
export function useAccounts(params) {
  return useQuery({
    queryKey: queryKeys.accounts(params),
    queryFn: () => crmApi.listAccounts(params),
  });
}

export function useAccountMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['accounts'] });
    qc.invalidateQueries({ queryKey: ['activityLogs'] });
  };
  return {
    create: useMutation({ mutationFn: crmApi.createAccount, onSuccess: invalidate }),
    update: useMutation({ mutationFn: ({ id, values }) => crmApi.updateAccount(id, values), onSuccess: invalidate }),
    remove: useMutation({ mutationFn: crmApi.deleteAccount, onSuccess: invalidate }),
    toggle: useMutation({ mutationFn: crmApi.toggleAccount, onSuccess: invalidate }),
  };
}

/* ---------- Activity logs ---------- */
export function useActivityLogs() {
  return useQuery({
    queryKey: queryKeys.activityLogs(),
    queryFn: crmApi.listActivityLogs,
  });
}

/* ---------- Profile ---------- */
export function useMe() {
  return useQuery({
    queryKey: queryKeys.me(),
    queryFn: crmApi.getMe,
    retry: false,
  });
}

export function useUpdateMe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: crmApi.updateMe,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['me'] });
      qc.invalidateQueries({ queryKey: ['activityLogs'] });
    },
  });
}

export { unwrapError };
