import api from './axios'

export const dpApi = {
    getInbox: (params) => api.get('/api/dp/workplace/inbox', { params }),
    getDPDocument: (dpId) => api.get(`/api/dp/${dpId}`),
    updateBasicData: (dpId, data) => api.patch(`/api/dp/${dpId}/basic-data`, data),
    updateLineItems: (dpId, data) => api.patch(`/api/dp/${dpId}/line-items`, data),
    updateAccounting: (dpId, data) => api.patch(`/api/dp/${dpId}/accounting`, data),
    updateTax: (dpId, data) => api.patch(`/api/dp/${dpId}/tax`, data),
    updateOtherData: (dpId, data) => api.patch(`/api/dp/${dpId}/other-data`, data),
    updateCumulative: (dpId, data) => api.patch(`/api/dp/${dpId}/cumulative`, data),
    resolveException: (dpId, ruleCode) => api.post(`/api/dp/${dpId}/resolve-exception`, { ruleCode }),
    refer: (dpId, data) => api.post(`/api/dp/${dpId}/refer`, data),
    returnToVendor: (dpId, data) => api.post(`/api/dp/${dpId}/return-to-vendor`, data),
    approve: (dpId, comments) => api.post(`/api/dp/${dpId}/approve`, { comments }),
    post: (dpId) => api.post(`/api/dp/${dpId}/post`),
    getHistory: (dpId) => api.get(`/api/dp/${dpId}/history`),
}

export const analyticsApi = {
    getVIMSummary: (params) => api.get('/api/analytics/vim-summary', { params }),
    getInvoiceTrends: (params) => api.get('/api/analytics/invoice-trends', { params }),
    getExceptionReport: (params) => api.get('/api/analytics/exception-report', { params }),
    getPaymentStatus: () => api.get('/api/analytics/payment-status'),
}

export const hrApi = {
    getLeaves: (params) => api.get('/api/hr/leaves', { params }),
    submitLeave: (data) => api.post('/api/hr/leaves', data),
    getLeaveById: (id) => api.get(`/api/hr/leaves/${id}`),
    updateLeave: (id, data) => api.patch(`/api/hr/leaves/${id}/update`, data),
    approveLeave: (id, data) => api.patch(`/api/hr/leaves/${id}`, data),
    getLeaveBalance: () => api.get('/api/hr/leave-balance'),
    getTravelClaims: () => api.get('/api/hr/travel-claims'),
    submitTravelClaim: (data) => api.post('/api/hr/travel-claims', data),
    getTravelClaimById: (id) => api.get(`/api/hr/travel-claims/${id}`),
    updateTravelClaim: (id, data) => api.patch(`/api/hr/travel-claims/${id}/update`, data),
    approveTravelClaim: (id, data) => api.patch(`/api/hr/travel-claims/${id}/approve`, data),
    processTravelClaim: (id, data) => api.patch(`/api/hr/travel-claims/${id}/process`, data),
}

export const adminApi = {
    getUsers: (params) => api.get('/api/admin/users', { params }),
    updateUserRole: (id, role) => api.patch(`/api/admin/users/${id}/role`, { role }),
    getWorkflowConfig: () => api.get('/api/admin/workflow-config'),
    updateWorkflowConfig: (data) => api.put('/api/admin/workflow-config', data),
    getChecklistConfig: () => api.get('/api/admin/checklist-config'),
    updateChecklistConfig: (data) => api.put('/api/admin/checklist-config', data),
    getAuditLogs: (params) => api.get('/api/admin/audit-logs', { params }),
    generateReport: (params) => api.get('/api/admin/reports/generate', { params }),
    // PO Management
    createPO: (data) => api.post('/api/admin/purchase-orders', data),
    getPurchaseOrders: (params) => api.get('/api/admin/purchase-orders', { params }),
    getPurchaseOrderById: (id) => api.get(`/api/admin/purchase-orders/${id}`),
    updatePO: (id, data) => api.put(`/api/admin/purchase-orders/${id}`, data),
    changePOStatus: (id, status) => api.patch(`/api/admin/purchase-orders/${id}/status`, { status }),
}

export const vendorApi = {
    getDashboard: () => api.get('/api/vendor/dashboard'),
    getPurchaseOrders: () => api.get('/api/vendor/purchase-orders'),
    getPODetail: (poNumber) => api.get(`/api/vendor/purchase-orders/${poNumber}`),
    validatePO: (poNumber) => api.post('/api/vendor/validate-po', { poNumber }),
    getProposal: (poNumber) => api.get(`/api/vendor/proposal/${poNumber}`),
    getSubUsers: () => api.get('/api/vendor/sub-users'),
    addSubUser: (data) => api.post('/api/vendor/sub-users', data),
    toggleSubUser: (id) => api.patch(`/api/vendor/sub-users/${id}/toggle`),
    getReports: (params) => api.get('/api/vendor/reports', { params }),
    getMessages: (invoiceId) => api.get(`/api/vendor/messages/${invoiceId}`),
    sendMessage: (data) => api.post('/api/vendor/messages', data),
    getNotifications: (params) => api.get('/api/vendor/notifications', { params }),
    markNotificationsRead: (ids) => api.patch('/api/vendor/notifications/read', { ids }),
}

export const invoiceApi = {
    getInvoices: (params) => api.get('/api/invoices', { params }),
    getInvoice: (id) => api.get(`/api/invoices/${id}`),
    submitPO: (data) => api.post('/api/invoices/submit/po', data),
    submitAdvance: (data) => api.post('/api/invoices/submit/advance', data),
    submitCreditMemo: (data) => api.post('/api/invoices/submit/credit-memo', data),
    submitRetentionRelease: (data) => api.post('/api/invoices/submit/retention-release', data),
    submitSubsequentDebit: (data) => api.post('/api/invoices/submit/subsequent-debit', data),
    submitDispatch: (data) => api.post('/api/invoices/submit/dispatch', data),
    submitCustomDuty: (data) => api.post('/api/invoices/submit/custom-duty', data),
    getPaymentAdvice: (id) => api.get(`/api/invoices/${id}/payment-advice`),
    getSESDocument: (id) => api.get(`/api/invoices/${id}/ses-document`),
    saveDraft: (id, data) => api.patch(`/api/invoices/${id}/save-draft`, data),
    getChecklist: (type, subtype) => api.get(`/api/invoices/checklist/${type}`, { params: { subtype } }),
}

export const workflowApi = {
    // Inbox & detail
    getInbox: (params) => api.get('/api/workflow/inbox', { params }),
    getFinanceInbox: (params) => api.get('/api/workflow/finance-inbox', { params }),
    getInvoiceDetail: (id) => api.get(`/api/workflow/${id}/detail`),
    getDashboardStats: () => api.get('/api/workflow/dashboard-stats'),
    getRecentActivity: () => api.get('/api/workflow/recent-activity'),
    getHistory: (id) => api.get(`/api/workflow/${id}/history`),
    // Actions
    approve: (id, comments) => api.post(`/api/workflow/${id}/approve`, { comments }),
    reject: (id, reason) => api.post(`/api/workflow/${id}/reject`, { reason }),
    requestClarification: (id, message) => api.post(`/api/workflow/${id}/clarification`, { message }),
    hold: (id, reason) => api.post(`/api/workflow/${id}/hold`, { reason }),
    forward: (id, comments) => api.post(`/api/workflow/${id}/forward`, { comments }),
    adjustPayment: (id, data) => api.post(`/api/workflow/${id}/adjust-payment`, data),
    approvePayment: (id, data) => api.post(`/api/workflow/${id}/approve-payment`, data),
    addComment: (id, comment, is_internal) => api.post(`/api/workflow/${id}/comment`, { comment, is_internal }),
}

export const profileApi = {
    updateProfile: (data) => api.patch('/api/profile/update', data),
}
