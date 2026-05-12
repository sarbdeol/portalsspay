import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Format a number as Indian-formatted currency-less rupees: 1,23,456
const num = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n) || n === 0) return value ? String(value) : '';
  return n.toLocaleString('en-IN');
};

// Field set used for the BIG CSV/PDF export of the bank accounts table —
// one row per account, every field as a column. Grouped: identity → account
// → UPI → net-banking creds → 3-user auth → card → limits → status →
// assignment (merchant only, no agent) → contact → KYC link → notes.
export const bankAccountExportFields = [
  // Identity
  { label: 'Bank ID', value: (a) => a.bankCode || `BNK-${String(a.id).padStart(4, '0')}` },
  { label: 'Bank Name', value: (a) => a.bankName },
  { label: 'Account Type', value: (a) => a.accountType },
  { label: 'Holder / Company', value: (a) => a.holderName || a.companyName },
  { label: 'Authorized Signatory', value: (a) => a.authorizedSignatory },
  { label: 'Company PAN', value: (a) => a.companyPan },
  { label: 'GST Number', value: (a) => a.gstNumber },

  // Account
  { label: 'Account Number', value: (a) => a.accountNumber },
  { label: 'IFSC', value: (a) => a.ifsc },
  { label: 'Branch', value: (a) => a.branch },
  { label: 'Bank Email', value: (a) => a.bankEmail },

  // UPI
  { label: 'UPI ID', value: (a) => a.upiId },
  { label: 'UPI App', value: (a) => a.upiApp },
  { label: 'UPI Mobile', value: (a) => a.upiMobile },

  // Net banking credentials
  { label: 'User ID', value: (a) => a.userId },
  { label: 'Login ID', value: (a) => a.username },
  { label: 'Customer ID', value: (a) => a.customerId },
  { label: 'Group ID', value: (a) => a.groupId },
  { label: 'Login Password', value: (a) => a.password },
  { label: 'MPIN', value: (a) => a.mpin },
  { label: 'Transaction Password', value: (a) => a.transactionPassword },
  { label: 'Authoriser Password', value: (a) => a.authoriserPassword },
  { label: 'TPIN', value: (a) => a.tpin },

  // 3-user authorization
  { label: 'Checker User ID', value: (a) => a.checkerUserId },
  { label: 'Checker Password', value: (a) => a.checkerPassword },
  { label: 'Maker User ID', value: (a) => a.makerUserId },
  { label: 'Maker Password', value: (a) => a.makerPassword },
  { label: 'Authoriser User ID', value: (a) => a.authoriserUserId },
  { label: 'Authoriser User Password', value: (a) => a.authoriserUserPassword },

  // Debit / ATM card
  { label: 'Card Number', value: (a) => a.cardNumber },
  { label: 'Cardholder', value: (a) => a.cardHolderName },
  { label: 'Card Expiry', value: (a) => a.cardExpiry },
  { label: 'CVV', value: (a) => a.cardCvv },
  { label: 'ATM PIN', value: (a) => a.atmPin },

  // Limits
  { label: 'Daily Limit', value: (a) => num(a.dailyLimit) },
  { label: 'Monthly Limit', value: (a) => num(a.monthlyLimit) },
  { label: 'Current Usage', value: (a) => num(a.currentUsage) },
  { label: 'Beneficiary Time Limit', value: (a) => a.beneficiaryTimeLimit },

  // Status & assignment (merchant only — agent is intentionally excluded)
  { label: 'Status', value: (a) => a.status },
  { label: 'Priority', value: (a) => a.priority },
  { label: 'Tags', value: (a) => Array.isArray(a.tags) ? a.tags.join(', ') : (a.tags || '') },
  { label: 'Merchant', value: (a) => a.merchant },
  { label: 'Added Date', value: (a) => a.addedDate },

  // Contact / recovery
  { label: 'Registered Mobile', value: (a) => a.registeredMobile },
  { label: 'Recovery Email', value: (a) => a.recoveryEmail },
  { label: 'WhatsApp', value: (a) => a.whatsapp },

  // Links
  { label: 'Net Banking URL', value: (a) => a.loginUrl },
  { label: 'KYC Document Link', value: (a) => a.kycUrl },

  { label: 'Notes', value: (a) => a.notes },
];

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
    ['Basic', 'Bank ID', account.bankCode || `BNK-${String(account.id).padStart(4, '0')}`],
    ['Basic', 'Internal ID', account.id],
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
    ['Net Banking', 'User ID', account.userId],
    ['Net Banking', 'Login ID', account.username],
    ['Net Banking', 'Customer ID', account.customerId],
    ['Net Banking', 'Group ID', account.groupId],
    ['Net Banking', 'Login Password', account.password],
    ['Net Banking', 'MPIN', account.mpin],
    ['Net Banking', 'Transaction Password', account.transactionPassword],
    ['Net Banking', 'Authoriser Password', account.authoriserPassword],
    ['Net Banking', 'TPIN', account.tpin],
    ['3-User Auth', 'Checker User ID', account.checkerUserId],
    ['3-User Auth', 'Checker Password', account.checkerPassword],
    ['3-User Auth', 'Maker User ID', account.makerUserId],
    ['3-User Auth', 'Maker Password', account.makerPassword],
    ['3-User Auth', 'Authoriser User ID', account.authoriserUserId],
    ['3-User Auth', 'Authoriser User Password', account.authoriserUserPassword],
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
    ['Assignment', 'Merchant', account.merchant],
    ['Assignment', 'Added Date', account.addedDate],
    ['Contact', 'Registered Mobile', account.registeredMobile],
    ['Contact', 'Recovery Email', account.recoveryEmail],
    ['Contact', 'WhatsApp', account.whatsapp],
    ['Links', 'Net Banking URL', account.loginUrl],
    ['Links', 'KYC Document Link', account.kycUrl],
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

// ---------------------------------------------------------------------------
// Bulk PDF — one account per "card" stacked vertically. 50+ fields don't fit
// readably across the page in a single row, so each account becomes its own
// 2-column key/value section with colored group headers.
// ---------------------------------------------------------------------------

const accountSections = (account) => {
  const showCorp = Boolean(account.companyName || account.companyPan || account.gstNumber || account.authorizedSignatory);
  const show3User = Boolean(
    account.checkerUserId || account.checkerPassword || account.makerUserId || account.makerPassword ||
    account.authoriserUserId || account.authoriserUserPassword
  );
  const showCard = Boolean(account.cardNumber || account.cardHolderName || account.cardExpiry || account.cardCvv || account.atmPin);
  const showContact = Boolean(account.registeredMobile || account.recoveryEmail || account.whatsapp);

  return [
    {
      title: 'Account',
      rows: [
        ['Account Number', account.accountNumber],
        ['IFSC', account.ifsc],
        ['Branch', account.branch],
        ['Bank Email', account.bankEmail],
        ['Holder / Company', account.holderName || account.companyName],
      ],
    },
    showCorp && {
      title: 'Corporate',
      rows: [
        ['Authorized Signatory', account.authorizedSignatory],
        ['Company PAN', account.companyPan],
        ['GST Number', account.gstNumber],
      ],
    },
    {
      title: 'UPI',
      rows: [
        ['UPI ID', account.upiId],
        ['UPI App', account.upiApp],
        ['UPI Mobile', account.upiMobile],
      ],
    },
    {
      title: 'Internet Banking',
      rows: [
        ['User ID', account.userId],
        ['Login ID', account.username],
        ['Customer ID', account.customerId],
        ['Group ID', account.groupId],
        ['Login Password', account.password],
        ['MPIN', account.mpin],
        ['Transaction Password', account.transactionPassword],
        ['Authoriser Password', account.authoriserPassword],
        ['TPIN', account.tpin],
      ],
    },
    show3User && {
      title: '3-User Authorization',
      rows: [
        ['Checker User ID', account.checkerUserId],
        ['Checker Password', account.checkerPassword],
        ['Maker User ID', account.makerUserId],
        ['Maker Password', account.makerPassword],
        ['Authoriser User ID', account.authoriserUserId],
        ['Authoriser User Password', account.authoriserUserPassword],
      ],
    },
    showCard && {
      title: 'Debit / ATM Card',
      rows: [
        ['Card Number', account.cardNumber],
        ['Cardholder', account.cardHolderName],
        ['Expiry', account.cardExpiry],
        ['CVV', account.cardCvv],
        ['ATM PIN', account.atmPin],
      ],
    },
    {
      title: 'Limits & Status',
      rows: [
        ['Daily Limit', num(account.dailyLimit)],
        ['Monthly Limit', num(account.monthlyLimit)],
        ['Current Usage', num(account.currentUsage)],
        ['Beneficiary Time Limit', account.beneficiaryTimeLimit],
        ['Status', account.status],
        ['Priority', account.priority],
        ['Tags', Array.isArray(account.tags) ? account.tags.join(', ') : (account.tags || '')],
      ],
    },
    {
      title: 'Merchant Assignment',
      rows: [
        ['Merchant', account.merchant],
        ['Added Date', account.addedDate],
      ],
    },
    showContact && {
      title: 'Contact / Recovery',
      rows: [
        ['Registered Mobile', account.registeredMobile],
        ['Recovery Email', account.recoveryEmail],
        ['WhatsApp', account.whatsapp],
      ],
    },
    {
      title: 'Links',
      rows: [
        ['Net Banking URL', account.loginUrl],
        ['KYC Document Link', account.kycUrl],
      ],
    },
    account.notes && {
      title: 'Notes',
      rows: [['Notes', account.notes]],
    },
  ].filter(Boolean);
};

export function downloadBankAccountsPdf(accounts, filename = 'bank-accounts') {
  if (!accounts.length) return;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 32;
  const generatedAt = new Date().toLocaleString();

  // Cover header on first page
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 70, 'F');
  doc.setTextColor(255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('Bank Accounts Report', margin, 32);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(200);
  doc.text(`${accounts.length} account${accounts.length === 1 ? '' : 's'}   •   Generated ${generatedAt}`, margin, 52);
  doc.setTextColor(0);

  let firstAccount = true;

  accounts.forEach((account) => {
    if (!firstAccount) doc.addPage();
    firstAccount = false;

    // Account banner
    const bannerY = firstAccount ? 80 : 36;
    let cursorY = firstAccount ? 80 : 36;
    doc.setFillColor(15, 23, 42);
    doc.rect(margin, cursorY, pageWidth - margin * 2, 36, 'F');
    doc.setTextColor(255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    const code = account.bankCode || `BNK-${String(account.id).padStart(4, '0')}`;
    doc.text(`${code}   ${account.bankName || ''}`, margin + 12, cursorY + 16);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(200);
    doc.text(
      `${account.accountType || ''}${account.holderName || account.companyName ? '   •   ' + (account.holderName || account.companyName) : ''}${account.status ? '   •   ' + account.status : ''}`,
      margin + 12,
      cursorY + 30,
    );
    doc.setTextColor(0);
    cursorY = bannerY + 44;

    accountSections(account).forEach((section) => {
      const body = section.rows
        .map(([label, value]) => [label, value === null || value === undefined || value === '' ? '—' : String(value)])
        .filter(([, value]) => value !== '—' || section.title === 'Account' || section.title === 'Links');

      autoTable(doc, {
        startY: cursorY,
        margin: { left: margin, right: margin },
        head: [[{ content: section.title, colSpan: 2, styles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: 'bold', fontSize: 9.5 } }]],
        body,
        theme: 'grid',
        styles: { fontSize: 8.5, cellPadding: { top: 4, right: 6, bottom: 4, left: 6 }, overflow: 'linebreak', lineColor: [226, 232, 240], lineWidth: 0.4 },
        columnStyles: {
          0: { cellWidth: 150, fontStyle: 'bold', textColor: [71, 85, 105], fillColor: [248, 250, 252] },
          1: { cellWidth: pageWidth - margin * 2 - 150, textColor: [15, 23, 42] },
        },
        didDrawPage: () => { cursorY = margin; },
      });
      cursorY = doc.lastAutoTable.finalY + 8;
    });
  });

  // Footer with page numbers
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i += 1) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin - 60, pageHeight - 16);
  }

  doc.save(`${filename}.pdf`);
}
