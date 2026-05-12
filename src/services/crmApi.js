import { apiClient } from './apiClient.js';

/* ---------- Agent mapping ---------- */
const fromAgent = (row) => ({
  id: row.id,
  name: row.name,
  username: row.username,
  email: row.email,
  mobile: row.mobile,
  whatsapp: row.whatsapp,
  telegram: row.telegram,
  address: row.address,
  notes: row.notes,
  status: row.status,
  lastPassword: row.last_password || '',
  merchants: row.merchants ?? 0,
  accounts: row.accounts ?? 0,
});

const toAgent = (values) => {
  const payload = {};
  if (values.username !== undefined) payload.username = values.username;
  if (values.name !== undefined) payload.full_name = values.name;
  if (values.email !== undefined) payload.email = values.email;
  if (values.mobile !== undefined) payload.mobile = values.mobile;
  if (values.whatsapp !== undefined) payload.whatsapp = values.whatsapp;
  if (values.telegram !== undefined) payload.telegram = values.telegram;
  if (values.address !== undefined) payload.address = values.address;
  if (values.notes !== undefined) payload.notes = values.notes;
  if (values.status !== undefined) payload.status = values.status;
  if (values.password) payload.password = values.password;
  return payload;
};

/* ---------- Merchant mapping ---------- */
const fromMerchant = (row) => ({
  id: row.id,
  name: row.name,
  username: row.username,
  email: row.email,
  agentId: row.agent_id ?? null,
  agent: row.agent_name || '',
  city: row.city,
  volume: row.volume,
  status: row.status,
  lastPassword: row.last_password || '',
  accounts: row.accounts ?? 0,
});

const toMerchant = (values) => {
  const payload = {};
  if (values.username !== undefined) payload.username = values.username;
  if (values.name !== undefined) payload.full_name = values.name;
  if (values.email !== undefined) payload.email = values.email;
  if (values.agentId !== undefined) payload.agent_id = values.agentId || null;
  if (values.city !== undefined) payload.city = values.city;
  if (values.volume !== undefined) payload.volume = values.volume;
  if (values.status !== undefined) payload.status = values.status;
  if (values.password) payload.password = values.password;
  return payload;
};

/* ---------- Bank account mapping ---------- */
const splitTags = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string' || !value.trim()) return [];
  return value.split(',').map((tag) => tag.trim()).filter(Boolean);
};

const fromAccount = (row) => ({
  id: row.id,
  bankName: row.bank_name,
  holderName: row.holder_name,
  accountNumber: row.account_number,
  ifsc: row.ifsc,
  branch: row.branch,
  accountType: row.account_type,
  upiId: row.upi_id,
  upiApp: row.upi_app,
  upiMobile: row.upi_mobile,
  customerId: row.customer_id,
  userId: row.user_id,
  username: row.username,
  password: row.password,
  transactionPassword: row.transaction_password,
  mpin: row.mpin,
  tpin: row.tpin,
  dailyLimit: Number(row.daily_limit ?? 0),
  monthlyLimit: Number(row.monthly_limit ?? 0),
  currentUsage: Number(row.current_usage ?? 0),
  beneficiaryTimeLimit: row.beneficiary_time_limit || '',
  bankEmail: row.bank_email || '',
  status: row.status,
  notes: row.notes,
  tags: row.tags || [],
  priority: row.priority,
  registeredMobile: row.registered_mobile,
  recoveryEmail: row.recovery_email,
  whatsapp: row.whatsapp,
  loginUrl: row.login_url,
  agentId: row.agent ?? null,
  merchantId: row.merchant ?? null,
  agent: row.agent_name || '',
  merchant: row.merchant_name || '',
  addedDate: row.added_date,
  kycToken: row.kyc_token || '',
  kycUrl: row.kyc_token ? `${window.location.origin}/kyc/${row.kyc_token}` : '',
  kycDocuments: Array.isArray(row.kyc_documents) ? row.kyc_documents : [],
});

const toAccount = (values) => ({
  bank_name: values.bankName,
  holder_name: values.holderName,
  account_number: values.accountNumber,
  ifsc: values.ifsc,
  branch: values.branch || '',
  account_type: values.accountType || 'Current',
  upi_id: values.upiId || '',
  upi_app: values.upiApp || '',
  upi_mobile: values.upiMobile || '',
  customer_id: values.customerId || '',
  user_id: values.userId || '',
  username: values.username || '',
  password: values.password || '',
  transaction_password: values.transactionPassword || '',
  mpin: values.mpin || '',
  tpin: values.tpin || '',
  daily_limit: Number(values.dailyLimit) || 0,
  monthly_limit: Number(values.monthlyLimit) || 0,
  current_usage: Number(values.currentUsage) || 0,
  beneficiary_time_limit: values.beneficiaryTimeLimit || '',
  bank_email: values.bankEmail || '',
  status: values.status || 'Pending',
  notes: values.notes || '',
  tags: splitTags(values.tags),
  priority: values.priority || 'Medium',
  registered_mobile: values.registeredMobile || '',
  recovery_email: values.recoveryEmail || '',
  whatsapp: values.whatsapp || '',
  login_url: values.loginUrl || '',
  agent: values.agentId || null,
  merchant: values.merchantId || null,
});

/* ---------- Activity log mapping ---------- */
const fromActivityLog = (row) => ({
  id: row.id,
  actor: row.actor,
  action: row.action,
  target: row.target,
  tone: row.tone,
  time: row.time,
  createdAt: row.created_at,
});

/* ---------- Error helper ---------- */
const unwrapError = (error) => {
  if (error?.response?.data) {
    const data = error.response.data;
    if (typeof data === 'string') return data;
    if (data.detail) return data.detail;
    const firstKey = Object.keys(data)[0];
    if (firstKey) {
      const value = data[firstKey];
      return Array.isArray(value) ? `${firstKey}: ${value[0]}` : `${firstKey}: ${value}`;
    }
  }
  return error?.message || 'Request failed';
};

const get = (url, params) =>
  apiClient.get(url, { params }).then((response) => response.data);
const post = (url, body) => apiClient.post(url, body).then((response) => response.data);
const patch = (url, body) => apiClient.patch(url, body).then((response) => response.data);
const del = (url) => apiClient.delete(url).then((response) => response.data);

/* ---------- API surface ---------- */
export const crmApi = {
  // Agents
  listAgents: (params) => get('/agents/', params).then((rows) => rows.map(fromAgent)),
  createAgent: (values) => post('/agents/', toAgent(values)).then(fromAgent),
  updateAgent: (id, values) => patch(`/agents/${id}/`, toAgent(values)).then(fromAgent),
  deleteAgent: (id) => del(`/agents/${id}/`),
  toggleAgent: (id) => post(`/agents/${id}/toggle_status/`).then(fromAgent),
  resetAgentPassword: (id, password = 'demo1234') =>
    post(`/agents/${id}/reset_password/`, { password }),

  // Merchants
  listMerchants: (params) => get('/merchants/', params).then((rows) => rows.map(fromMerchant)),
  createMerchant: (values) => post('/merchants/', toMerchant(values)).then(fromMerchant),
  updateMerchant: (id, values) => patch(`/merchants/${id}/`, toMerchant(values)).then(fromMerchant),
  deleteMerchant: (id) => del(`/merchants/${id}/`),
  toggleMerchant: (id) => post(`/merchants/${id}/toggle_status/`).then(fromMerchant),
  resetMerchantPassword: (id, password = 'demo1234') =>
    post(`/merchants/${id}/reset_password/`, { password }),

  // Bank accounts
  listAccounts: (params) => get('/bank-accounts/', params).then((rows) => rows.map(fromAccount)),
  createAccount: (values) => post('/bank-accounts/', toAccount(values)).then(fromAccount),
  updateAccount: (id, values) => patch(`/bank-accounts/${id}/`, toAccount(values)).then(fromAccount),
  deleteAccount: (id) => del(`/bank-accounts/${id}/`),
  toggleAccount: (id) => post(`/bank-accounts/${id}/toggle_status/`).then(fromAccount),

  // Activity logs
  listActivityLogs: () => get('/activity-logs/').then((rows) => rows.map(fromActivityLog)),

  // KYC (public endpoints — no auth required)
  getKycPublic: (token) => apiClient.get(`/public/kyc/${token}/`).then((r) => r.data),
  uploadKycDocument: (token, file, { label = '', uploadedBy = '' } = {}) => {
    const form = new FormData();
    form.append('file', file);
    if (label) form.append('label', label);
    if (uploadedBy) form.append('uploaded_by', uploadedBy);
    return apiClient
      .post(`/public/kyc/${token}/upload/`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then((r) => r.data);
  },
  deleteKycDocument: (id) => del(`/kyc-documents/${id}/`),

  // Me
  getMe: () => get('/me/'),
  updateMe: (values) => patch('/me/', values),
  changePassword: ({ currentPassword, newPassword }) =>
    post('/auth/change-password/', { current_password: currentPassword, new_password: newPassword }),
  forgotPassword: (email) => post('/auth/forgot-password/', { email }),
  resetPassword: ({ uid, token, newPassword }) =>
    post('/auth/reset-password/', { uid, token, new_password: newPassword }),
};

export { unwrapError };
