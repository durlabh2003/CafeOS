/**
 * CafeOS CSV Data Exporter
 * 
 * Generates and downloads CSV files for orders, payments, and CRM data
 * with proper escaping and formatting.
 */

/**
 * Escape a value for CSV format
 * @param {*} value - The value to escape
 * @returns {string} CSV-safe string
 */
function escapeCSV(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Generic CSV download utility
 * @param {Array<string>} headers - Column headers
 * @param {Array<Array>} rows - Array of row arrays
 * @param {string} filename - Download filename
 */
function downloadCSV(headers, rows, filename) {
  const headerLine = headers.map(escapeCSV).join(',');
  const dataLines = rows.map(row => row.map(escapeCSV).join(','));
  const csvContent = [headerLine, ...dataLines].join('\n');

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export all orders as CSV
 * @param {Array} orders - Orders array from context
 * @param {Array} tables - Tables array for name lookup
 */
export function exportOrdersCSV(orders, tables) {
  const headers = [
    'Order ID',
    'Order Number',
    'Table',
    'Source',
    'Status',
    'Items',
    'Item Details',
    'Amount (₹)',
    'Notes',
    'Timestamp'
  ];

  const rows = orders.map(order => {
    const tableName = tables.find(t => t.id === order.tableId)?.name || order.source || 'Takeaway';
    const itemCount = order.items ? order.items.reduce((sum, it) => sum + (it.qty || 1), 0) : 0;
    const itemDetails = order.items ? order.items.map(it => `${it.name} x${it.qty}`).join(' | ') : '';

    return [
      order.id,
      order.orderNumber || order.id,
      tableName,
      order.source || 'Dine-In',
      order.status,
      itemCount,
      itemDetails,
      order.amount || 0,
      order.notes || '',
      order.timestamp ? new Date(order.timestamp).toLocaleString() : ''
    ];
  });

  const timestamp = new Date().toISOString().split('T')[0];
  downloadCSV(headers, rows, `CafeOS_Orders_${timestamp}.csv`);

  return { success: true, rowCount: rows.length };
}

/**
 * Export all payments as CSV
 * @param {Array} payments - Payments array from context
 */
export function exportPaymentsCSV(payments) {
  const headers = [
    'Transaction ID',
    'Bill Reference',
    'Customer',
    'Table',
    'Payment Mode',
    'Amount (₹)',
    'Collected By',
    'Timestamp'
  ];

  const rows = payments.map(payment => [
    payment.id,
    payment.billRef || payment.bill_id || '',
    payment.customerName || 'Walk-in',
    payment.tableName || 'N/A',
    payment.mode || '',
    payment.amount || 0,
    payment.collectedBy || payment.collected_by || '',
    payment.timestamp ? new Date(payment.timestamp).toLocaleString() : ''
  ]);

  const timestamp = new Date().toISOString().split('T')[0];
  downloadCSV(headers, rows, `CafeOS_Payments_${timestamp}.csv`);

  return { success: true, rowCount: rows.length };
}

/**
 * Export CRM customer data as CSV
 * @param {Object} crm - CRM dictionary from context
 */
export function exportCrmCSV(crm) {
  const headers = [
    'Name',
    'Mobile',
    'Visit Count',
    'Total Spend (₹)',
    'Avg Order Value (₹)',
    'Last Visit'
  ];

  const customers = Object.values(crm);
  const rows = customers.map(c => {
    const visits = c.visit_count || c.visits || 0;
    const totalSpend = c.totalSpend || c.total_spend || 0;
    const aov = visits > 0 ? Math.round(totalSpend / visits) : 0;

    return [
      c.name || 'Guest',
      c.mobile || '',
      visits,
      totalSpend,
      aov,
      c.lastVisit || c.last_visit || ''
    ];
  });

  const timestamp = new Date().toISOString().split('T')[0];
  downloadCSV(headers, rows, `CafeOS_Customers_${timestamp}.csv`);

  return { success: true, rowCount: rows.length };
}
