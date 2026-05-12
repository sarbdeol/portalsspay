// Per-account export to a CSV that Excel opens natively (UTF-8 BOM).
// Includes every field — credentials and card secrets included by design,
// because admins use this for handover. Treat the file as sensitive.

const escape = (value) => {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/[",\n]/.test(str)) return `"${str.replaceAll('"', '""')}"`;
  return str;
};

const fileBaseName = (account) => {
  const slug = String(account.bankName || 'bank').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();
  return `account-${account.id}-${slug || 'bank'}`;
};

export function buildAccountRows(account) {
  return [
    ['Section', 'Field', 'Value'],
    ['Basic', 'ID', account.id],
    ['Basic', 'Bank', account.bankName],
    ['Basic', 'Account Type', account.accountType],
    ['Basic', 'Holder Name', account.holderName],
    ['Basic', 'Company Name', account.companyName],
    ['Basic', 'Authorized Signatory', account.authorizedSignatory],
    ['Basic', 'Account Number', account.accountNumber],
    ['Basic', 'IFSC', account.ifsc],
    ['Basic', 'Branch', account.branch],
    ['Basic', 'Bank Email', account.bankEmail],
    ['Corporate', 'Company PAN', account.companyPan],
    ['Corporate', 'GST Number', account.gstNumber],
    ['UPI', 'UPI ID', account.upiId],
    ['UPI', 'UPI App', account.upiApp],
    ['UPI', 'UPI Mobile', account.upiMobile],
    ['Net Banking', 'Customer ID', account.customerId],
    ['Net Banking', 'User ID', account.userId],
    ['Net Banking', 'Username', account.username],
    ['Net Banking', 'Password', account.password],
    ['Net Banking', 'Transaction Password', account.transactionPassword],
    ['Net Banking', 'MPIN', account.mpin],
    ['Net Banking', 'TPIN', account.tpin],
    ['Card', 'Card Number', account.cardNumber],
    ['Card', 'Cardholder', account.cardHolderName],
    ['Card', 'Expiry', account.cardExpiry],
    ['Card', 'CVV', account.cardCvv],
    ['Card', 'ATM PIN', account.atmPin],
    ['Limits', 'Daily Limit', account.dailyLimit],
    ['Limits', 'Monthly Limit', account.monthlyLimit],
    ['Limits', 'Current Usage', account.currentUsage],
    ['Limits', 'Beneficiary Time Limit', account.beneficiaryTimeLimit],
    ['Status', 'Status', account.status],
    ['Status', 'Priority', account.priority],
    ['Status', 'Tags', Array.isArray(account.tags) ? account.tags.join(', ') : account.tags],
    ['Assignment', 'Agent', account.agent],
    ['Assignment', 'Merchant', account.merchant],
    ['Assignment', 'Added Date', account.addedDate],
    ['Contact', 'Registered Mobile', account.registeredMobile],
    ['Contact', 'Recovery Email', account.recoveryEmail],
    ['Contact', 'WhatsApp', account.whatsapp],
    ['Links', 'Net Banking URL', account.loginUrl],
    ['Links', 'KYC URL', account.kycUrl],
    ['Notes', 'Notes', account.notes],
  ];
}

export function downloadAccountExcel(account) {
  const rows = buildAccountRows(account);
  const csv = rows.map((row) => row.map(escape).join(',')).join('\r\n');
  // UTF-8 BOM tells Excel to render unicode properly.
  const blob = new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${fileBaseName(account)}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}
