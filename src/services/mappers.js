export function profileFromRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email || '',
    fullName: row.full_name || '',
    role: row.role === 'admin' ? 'admin' : 'user',
    isSuspended: Boolean(row.is_suspended),
    createdAt: row.created_at,
    lastSeenAt: row.last_seen_at,
  };
}

export function accountFromRow(row) {
  return {
    id: Number(row.id),
    name: row.name,
    icon: row.icon,
    color: row.color,
    initialBalance: Number(row.initial_balance) || 0,
    isDefault: Boolean(row.is_default),
    isActive: row.is_active !== false,
    order: Number(row.sort_order) || 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function accountToRow(data = {}) {
  return {
    name: String(data.name || '').trim(),
    icon: data.icon || '💵',
    color: data.color || '#6366f1',
    initial_balance: Math.round(Number(data.initialBalance) || 0),
    is_default: Boolean(data.isDefault),
    is_active: data.isActive !== false,
    sort_order: data.order ?? 0,
  };
}

export function categoryFromRow(row) {
  return {
    id: Number(row.id),
    type: row.type,
    name: row.name,
    icon: row.icon,
    color: row.color,
    isDefault: Boolean(row.is_default),
    order: Number(row.sort_order) || 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function categoryToRow(data = {}) {
  return {
    type: data.type === 'income' ? 'income' : 'expense',
    name: String(data.name || '').trim(),
    icon: data.icon || '📦',
    color: data.color || '#6366f1',
    is_default: Boolean(data.isDefault),
    sort_order: data.order ?? 0,
  };
}

export function budgetFromRow(row) {
  return {
    id: Number(row.id),
    categoryId: Number(row.category_id),
    amount: Number(row.amount) || 0,
    period: row.period,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function transactionFromRow(row) {
  return {
    id: Number(row.id),
    type: row.type,
    amount: Number(row.amount) || 0,
    categoryId: Number(row.category_id),
    accountId: Number(row.account_id),
    date: row.date,
    time: row.time ? String(row.time).slice(0, 5) : '',
    note: row.note || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function transactionToRow(data = {}) {
  return {
    type: data.type === 'income' ? 'income' : 'expense',
    amount: Math.max(0, Math.round(Number(data.amount) || 0)),
    category_id: Number(data.categoryId),
    account_id: Number(data.accountId),
    date: data.date,
    time: data.time || '00:00',
    note: String(data.note || '').trim(),
  };
}

export function transferFromRow(row) {
  return {
    id: Number(row.id),
    fromAccountId: Number(row.from_account_id),
    toAccountId: Number(row.to_account_id),
    amount: Number(row.amount) || 0,
    date: row.date,
    time: row.time ? String(row.time).slice(0, 5) : '',
    note: row.note || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function adFromRow(row) {
  return {
    id: Number(row.id),
    provider: row.provider,
    source: row.source === 'public' ? 'public' : 'admin',
    placement: row.placement,
    title: row.title,
    body: row.body || '',
    imagePath: row.image_path || '',
    targetUrl: row.target_url || '',
    ctaLabel: row.cta_label || 'Pelajari',
    adsenseSlot: row.adsense_slot || '',
    adsenseFormat: row.adsense_format || 'auto',
    isActive: Boolean(row.is_active),
    priority: Number(row.priority) || 0,
    advertiserId: row.advertiser_id || null,
    packageId: row.package_id ? Number(row.package_id) : null,
    startsAt: row.starts_at || '',
    endsAt: row.ends_at || '',
    createdBy: row.created_by || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function adPackageFromRow(row) {
  return {
    id: Number(row.id),
    name: row.name,
    description: row.description || '',
    placement: row.placement,
    durationDays: Number(row.duration_days) || 1,
    priceIdr: Number(row.price_idr) || 0,
    priority: Number(row.priority) || 0,
    isActive: row.is_active !== false,
    sortOrder: Number(row.sort_order) || 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function adPaymentSettingsFromRow(row) {
  return {
    bankName: row?.bank_name || '',
    accountNumber: row?.account_number || '',
    accountHolder: row?.account_holder || '',
    qrisImagePath: row?.qris_image_path || '',
    instructions: row?.instructions || '',
    acceptingOrders: Boolean(row?.accepting_orders),
    updatedAt: row?.updated_at || null,
  };
}

export function adOrderFromRow(row) {
  return {
    id: Number(row.id),
    orderCode: row.order_code,
    publicToken: row.public_token,
    adId: Number(row.ad_id),
    advertiserId: row.advertiser_id || null,
    source: row.source || 'public',
    contactName: row.contact_name || '',
    contactEmail: row.contact_email || '',
    contactPhone: row.contact_phone || '',
    packageId: Number(row.package_id),
    packageName: row.package_name || '',
    placement: row.placement,
    durationDays: Number(row.duration_days) || 1,
    priority: Number(row.priority) || 0,
    baseAmount: Number(row.base_amount) || 0,
    uniqueCode: Number(row.unique_code) || 0,
    totalAmount: Number(row.total_amount) || 0,
    paymentMethod: row.payment_method || 'bank_transfer',
    status: row.status,
    proofPath: row.proof_path || '',
    payerName: row.payer_name || '',
    payerNote: row.payer_note || '',
    termsAcceptedAt: row.terms_accepted_at,
    expiresAt: row.expires_at,
    submittedAt: row.submitted_at,
    reviewedAt: row.reviewed_at,
    reviewNote: row.review_note || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ad: row.ads ? adFromRow(row.ads) : null,
  };
}

export function adToRow(data = {}) {
  return {
    provider: data.provider === 'adsense' ? 'adsense' : 'sponsor',
    placement: data.placement,
    title: String(data.title || '').trim(),
    body: String(data.body || '').trim(),
    image_path: data.imagePath || null,
    target_url: data.targetUrl || null,
    cta_label: String(data.ctaLabel || 'Pelajari').trim() || 'Pelajari',
    adsense_slot: data.adsenseSlot || null,
    adsense_format: data.adsenseFormat || 'auto',
    is_active: data.isActive !== false,
    priority: Number(data.priority) || 0,
    starts_at: data.startsAt || null,
    ends_at: data.endsAt || null,
  };
}

export function settingsRowsToObject(rows = []) {
  return rows.reduce((settings, row) => {
    settings[row.key] = row.value;
    return settings;
  }, {});
}
