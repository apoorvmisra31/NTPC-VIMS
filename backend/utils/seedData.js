require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const PurchaseOrder = require('../models/PurchaseOrder');
const Invoice = require('../models/Invoice');
const DPDocument = require('../models/DPDocument');
const config = require('../config/env');

const seedData = async () => {
  try {
    await mongoose.connect(config.mongoUri);
    console.log('MongoDB Connected for seeding...');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      PurchaseOrder.deleteMany({}),
      Invoice.deleteMany({}),
      DPDocument.deleteMany({}),
    ]);
    console.log('Cleared existing data');

    // ===== USERS =====
    const users = await User.create([
      {
        email: 'vendor1@example.com', password: 'password123', role: 'vendor',
        vendorCode: 'V1001', vendorName: 'ABC Engineering Pvt Ltd',
        companyName: 'ABC Engineering', gstin: '27AADCA1234B1ZZ',
        plant: 'Dadri', isActive: true,
        contactPerson: { name: 'Rajesh Kumar', phone: '9876543210' },
        bankDetails: {
          bankName: 'State Bank of India', accountNumber: '30987654321',
          ifscCode: 'SBIN0001234', branchName: 'Delhi Main',
        },
      },
      {
        email: 'vendor2@example.com', password: 'password123', role: 'vendor',
        vendorCode: 'V1002', vendorName: 'XYZ Steel Industries',
        companyName: 'XYZ Steel', gstin: '09BBBCX5678Y1ZZ',
        plant: 'Rihand', isActive: true,
        contactPerson: { name: 'Suresh Patel', phone: '9876543211' },
        bankDetails: {
          bankName: 'HDFC Bank', accountNumber: '50123456789',
          ifscCode: 'HDFC0004567', branchName: 'Mumbai Andheri',
        },
      },
      {
        email: 'vpd@ntpc.co.in', password: 'password123', role: 'vpd',
        plant: 'Dadri', department: 'VIM Processing Desk', isActive: true,
        contactPerson: { name: 'Amit VPD', phone: '9876500001' },
      },
      {
        email: 'eic@ntpc.co.in', password: 'password123', role: 'eic',
        plant: 'Dadri', department: 'Engineering-in-Charge', isActive: true,
        contactPerson: { name: 'Priya EIC', phone: '9876500002' },
      },
      {
        email: 'vpg@ntpc.co.in', password: 'password123', role: 'vpg',
        plant: 'Dadri', department: 'VIM Payment Group', isActive: true,
        contactPerson: { name: 'Vikram VPG', phone: '9876500003' },
      },
      {
        email: 'finance@ntpc.co.in', password: 'password123', role: 'finance',
        plant: 'Dadri', department: 'Finance', isActive: true,
        contactPerson: { name: 'Finance Officer', phone: '9876500004' },
      },
      {
        email: 'hr@ntpc.co.in', password: 'password123', role: 'hr_admin',
        plant: 'Dadri', department: 'Human Resources', isActive: true,
        contactPerson: { name: 'HR Admin', phone: '9876500005' },
      },
      {
        email: 'admin@ntpc.co.in', password: 'password123', role: 'system_admin',
        plant: 'Dadri', department: 'IT', isActive: true,
        contactPerson: { name: 'System Admin', phone: '9876500099' },
      },
    ]);

    console.log(`Created ${users.length} users`);

    // ===== PURCHASE ORDERS =====
    const purchaseOrders = await PurchaseOrder.create([
      {
        poNumber: 'PO-4500001234', poType: 'Standard', poDate: new Date('2025-01-15'),
        vendorCode: 'V1001', vendorName: 'ABC Engineering Pvt Ltd',
        companyCode: '1000', plant: 'Dadri', isMaterial: true,
        purchasingOrg: '1000', purchasingGroup: 'PG1', documentDate: new Date('2025-01-15'),
        currency: 'INR', totalAmount: 5000000, grossAmount: 5000000,
        validityDate: new Date('2026-12-31'), paymentTerms: 'NET30',
        capexOpex: 'CAPEX', status: 'Open',
        lineItems: [
          { lineNumber: 10, material: 'M-001', description: 'High Pressure Steel Pipes (Grade B)', quantity: 100, unit: 'NOS', rate: 25000, amount: 2500000, taxCode: 'G18', grQuantity: 80, sesQuantity: 0, invoicedQuantity: 0, balanceQuantity: 100 },
          { lineNumber: 20, material: 'M-002', description: 'Boiler Tubes (Alloy Steel)', quantity: 200, unit: 'MTR', rate: 12500, amount: 2500000, taxCode: 'G18', grQuantity: 150, sesQuantity: 0, invoicedQuantity: 0, balanceQuantity: 200 },
        ],
      },
      {
        poNumber: 'PO-4500001235', poType: 'Service', poDate: new Date('2025-02-01'),
        vendorCode: 'V1001', vendorName: 'ABC Engineering Pvt Ltd',
        companyCode: '1000', plant: 'Dadri', isMaterial: false,
        purchasingOrg: '1000', purchasingGroup: 'PG2', documentDate: new Date('2025-02-01'),
        currency: 'INR', totalAmount: 3000000, grossAmount: 3000000,
        validityDate: new Date('2026-06-30'), paymentTerms: 'NET45',
        capexOpex: 'OPEX', status: 'Open',
        lineItems: [
          { lineNumber: 10, material: 'S-001', description: 'Annual Maintenance of Turbine Unit-2', quantity: 1, unit: 'LS', rate: 3000000, amount: 3000000, taxCode: 'S18', grQuantity: 0, sesQuantity: 1, invoicedQuantity: 0, balanceQuantity: 1 },
        ],
      },
      {
        poNumber: 'PO-4500001236', poType: 'Standard', poDate: new Date('2025-03-10'),
        vendorCode: 'V1002', vendorName: 'XYZ Steel Industries',
        companyCode: '2000', plant: 'Rihand', isMaterial: true,
        purchasingOrg: '2000', purchasingGroup: 'PG1', documentDate: new Date('2025-03-10'),
        currency: 'INR', totalAmount: 8000000, grossAmount: 8000000,
        validityDate: new Date('2026-12-31'), paymentTerms: 'NET30',
        capexOpex: 'CAPEX', status: 'Open',
        lineItems: [
          { lineNumber: 10, material: 'M-010', description: 'Structural Steel I-Beams (Grade A)', quantity: 500, unit: 'KG', rate: 8000, amount: 4000000, taxCode: 'G18', grQuantity: 400, sesQuantity: 0, invoicedQuantity: 0, balanceQuantity: 500 },
          { lineNumber: 20, material: 'M-011', description: 'Welding Electrodes (E7018)', quantity: 1000, unit: 'PKT', rate: 2000, amount: 2000000, taxCode: 'G18', grQuantity: 800, sesQuantity: 0, invoicedQuantity: 0, balanceQuantity: 1000 },
          { lineNumber: 30, material: 'M-012', description: 'Reinforcement Steel Bars (TMT)', quantity: 2000, unit: 'KG', rate: 1000, amount: 2000000, taxCode: 'G18', grQuantity: 1500, sesQuantity: 0, invoicedQuantity: 0, balanceQuantity: 2000 },
        ],
      },
      {
        poNumber: 'PO-4500001237', poType: 'Service', poDate: new Date('2025-04-01'),
        vendorCode: 'V1002', vendorName: 'XYZ Steel Industries',
        companyCode: '2000', plant: 'Rihand', isMaterial: false,
        purchasingOrg: '2000', purchasingGroup: 'PG2', documentDate: new Date('2025-04-01'),
        currency: 'INR', totalAmount: 1500000, grossAmount: 1500000,
        validityDate: new Date('2026-09-30'), paymentTerms: 'NET30',
        capexOpex: 'OPEX', status: 'Open',
        lineItems: [
          { lineNumber: 10, material: 'S-010', description: 'Civil Foundation Work for Chimney Extension', quantity: 1, unit: 'LS', rate: 1500000, amount: 1500000, taxCode: 'S18', grQuantity: 0, sesQuantity: 0, invoicedQuantity: 0, balanceQuantity: 1 },
        ],
      },
      {
        poNumber: 'PO-4500001238', poType: 'Standard', poDate: new Date('2025-05-15'),
        vendorCode: 'V1001', vendorName: 'ABC Engineering Pvt Ltd',
        companyCode: '1000', plant: 'Singrauli', isMaterial: true,
        purchasingOrg: '1000', purchasingGroup: 'PG1', documentDate: new Date('2025-05-15'),
        currency: 'INR', totalAmount: 2000000, grossAmount: 2000000,
        validityDate: new Date('2026-12-31'), paymentTerms: 'NET60',
        capexOpex: 'CAPEX', status: 'Open',
        lineItems: [
          { lineNumber: 10, material: 'M-020', description: 'Electrical Switchgear Panel (11KV)', quantity: 5, unit: 'NOS', rate: 400000, amount: 2000000, taxCode: 'G18', grQuantity: 3, sesQuantity: 0, invoicedQuantity: 0, balanceQuantity: 5 },
        ],
      },
    ]);

    console.log(`Created ${purchaseOrders.length} Purchase Orders`);

    // ===== SAMPLE INVOICES =====
    const invoices = await Invoice.create([
      {
        invoiceNumber: 'INV-2025-001', invoiceType: 'PO Invoice', subtype: 'Standard',
        vendorCode: 'V1001', vendorName: 'ABC Engineering Pvt Ltd',
        poNumber: 'PO-4500001234', companyCode: '1000', plant: 'Dadri',
        invoiceDate: new Date('2025-06-15'), grossAmount: 2500000, taxAmount: 450000, netAmount: 2950000,
        status: 'Submitted', workflowStage: 'VPD', channel: 'Flipper',
        submittedBy: users[0]._id, submittedAt: new Date('2025-06-16'),
        lineItems: [
          { poLineNumber: 10, description: 'High Pressure Steel Pipes', quantity: 50, unit: 'NOS', rate: 25000, amount: 1250000 },
          { poLineNumber: 20, description: 'Boiler Tubes', quantity: 100, unit: 'MTR', rate: 12500, amount: 1250000 },
        ],
        gstDetails: { gstin: '27AADCA1234B1ZZ', cgst: 225000, sgst: 225000, igst: 0 },
        bankDetails: { bankName: 'State Bank of India', accountNumber: '30987654321', ifscCode: 'SBIN0001234', branchName: 'Delhi Main' },
      },
      {
        invoiceNumber: 'INV-2025-002', invoiceType: 'PO Invoice', subtype: 'Standard',
        vendorCode: 'V1002', vendorName: 'XYZ Steel Industries',
        poNumber: 'PO-4500001236', companyCode: '2000', plant: 'Rihand',
        invoiceDate: new Date('2025-07-01'), grossAmount: 4000000, taxAmount: 720000, netAmount: 4720000,
        status: 'Under Review', workflowStage: 'EIC', channel: 'Flipper',
        submittedBy: users[1]._id, submittedAt: new Date('2025-07-02'),
        lineItems: [
          { poLineNumber: 10, description: 'Structural Steel I-Beams', quantity: 300, unit: 'KG', rate: 8000, amount: 2400000 },
          { poLineNumber: 20, description: 'Welding Electrodes', quantity: 500, unit: 'PKT', rate: 2000, amount: 1000000 },
          { poLineNumber: 30, description: 'TMT Steel Bars', quantity: 600, unit: 'KG', rate: 1000, amount: 600000 },
        ],
        gstDetails: { gstin: '09BBBCX5678Y1ZZ', cgst: 0, sgst: 0, igst: 720000 },
        bankDetails: { bankName: 'HDFC Bank', accountNumber: '50123456789', ifscCode: 'HDFC0004567', branchName: 'Mumbai Andheri' },
      },
    ]);

    console.log(`Created ${invoices.length} Invoices`);

    // ===== DP DOCUMENTS =====
    const dpDocs = await DPDocument.create([
      {
        dpId: `DP-${Date.now()}-001`, invoiceRef: invoices[0]._id,
        ingestionChannel: 'Flipper',
        basicData: {
          vendorCode: 'V1001', vendorName: 'ABC Engineering Pvt Ltd',
          poNumber: 'PO-4500001234', companyCode: '1000', plant: 'Dadri',
          grossAmount: 2500000, currency: 'INR', gstin: '27AADCA1234B1ZZ',
        },
        lineItems: {
          poReference: [
            { lineNumber: 10, description: 'High Pressure Steel Pipes', quantity: 50, unit: 'NOS', rate: 25000, amount: 1250000 },
            { lineNumber: 20, description: 'Boiler Tubes', quantity: 100, unit: 'MTR', rate: 12500, amount: 1250000 },
          ],
        },
        accounting: { paymentTerms: 'NET30', paymentMethod: 'Q', businessArea: '1000', businessPlace: 'DL' },
        taxData: { cgst: 225000, sgst: 225000, igst: 0, cess: 0 },
        workflow: {
          currentStage: 'VPD', currentAssignee: users[2]._id,
          history: [
            { stage: 'VPD', action: 'Received', user: users[0]._id, userName: 'vendor1@example.com', timestamp: new Date(), comments: 'Invoice submitted via Flipper' },
          ],
        },
        status: 'In Progress',
      },
      {
        dpId: `DP-${Date.now()}-002`, invoiceRef: invoices[1]._id,
        ingestionChannel: 'Flipper',
        basicData: {
          vendorCode: 'V1002', vendorName: 'XYZ Steel Industries',
          poNumber: 'PO-4500001236', companyCode: '2000', plant: 'Rihand',
          grossAmount: 4000000, currency: 'INR', gstin: '09BBBCX5678Y1ZZ',
        },
        lineItems: {
          poReference: [
            { lineNumber: 10, description: 'Structural Steel I-Beams', quantity: 300, unit: 'KG', rate: 8000, amount: 2400000 },
          ],
        },
        workflow: {
          currentStage: 'EIC L1', currentAssignee: users[3]._id,
          history: [
            { stage: 'VPD', action: 'Received', user: users[1]._id, userName: 'vendor2@example.com', timestamp: new Date('2025-07-02'), comments: 'Invoice submitted' },
            { stage: 'VPD', action: 'Approved', user: users[2]._id, userName: 'vpd@ntpc.co.in', timestamp: new Date('2025-07-03'), comments: 'Forwarded to EIC' },
          ],
        },
        exceptionFlags: [
          { ruleCode: 'BR009', ruleName: 'GST Rate Mismatch', severity: 'Yellow', message: 'Applied GST rate may not match configured rate', procType: 890, isResolved: false, bypassable: true },
        ],
        status: 'Awaiting Approval',
      },
    ]);

    console.log(`Created ${dpDocs.length} DP Documents`);

    // Summary
    console.log('\n✅ Seeding Complete!');
    console.log('═'.repeat(50));
    console.log('Login Credentials:');
    console.log('─'.repeat(50));
    console.log('| Vendor 1   | vendor1@example.com  | password123 |');
    console.log('| Vendor 2   | vendor2@example.com  | password123 |');
    console.log('| VPD        | vpd@ntpc.co.in       | password123 |');
    console.log('| EIC        | eic@ntpc.co.in       | password123 |');
    console.log('| VPG        | vpg@ntpc.co.in       | password123 |');
    console.log('| Finance    | finance@ntpc.co.in   | password123 |');
    console.log('| HR Admin   | hr@ntpc.co.in        | password123 |');
    console.log('| Sys Admin  | admin@ntpc.co.in     | password123 |');
    console.log('═'.repeat(50));

    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedData();
