/**
 * Seed script for NTPC VIMS+ Enterprise Workflow Platform
 * Creates demo users, vendors, POs for testing the full workflow.
 * 
 * Run: node utils/seedWorkflow.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');
const User = require('../models/User');
const Vendor = require('../models/Vendor');
const PurchaseOrder = require('../models/PurchaseOrder');

async function seed() {
  await connectDB();
  console.log('🌱 Seeding workflow demo data...\n');

  const password = await bcrypt.hash('password123', 10);

  // 1. Create Vendors
  const vendors = await Promise.all([
    Vendor.findOneAndUpdate(
      { vendor_code: 'V001' },
      { vendor_name: 'Tata Projects Ltd', vendor_code: 'V001', email: 'vendor1@test.com', gst_number: '27AABCT1234D1ZP', status: 'ACTIVE' },
      { upsert: true, new: true }
    ),
    Vendor.findOneAndUpdate(
      { vendor_code: 'V002' },
      { vendor_name: 'Larsen & Toubro', vendor_code: 'V002', email: 'vendor2@test.com', gst_number: '27AABCL5678E2ZQ', status: 'ACTIVE' },
      { upsert: true, new: true }
    ),
  ]);
  console.log(`✅ Created ${vendors.length} vendors`);

  // 2. Create Users
  const users = [
    { email: 'vendor1@test.com', password, role: 'vendor', vendorCode: 'V001', vendorName: 'Tata Projects Ltd', isActive: true, status: 'ACTIVE' },
    { email: 'vendor2@test.com', password, role: 'vendor', vendorCode: 'V002', vendorName: 'Larsen & Toubro', isActive: true, status: 'ACTIVE' },
    { email: 'vpd@test.com', password, role: 'vpd', plant: 'PLANT-01', isActive: true, status: 'ACTIVE' },
    { email: 'eic@test.com', password, role: 'eic', plant: 'PLANT-01', isActive: true, status: 'ACTIVE' },
    { email: 'vpg@test.com', password, role: 'vpg', plant: 'PLANT-01', isActive: true, status: 'ACTIVE' },
    { email: 'finance@test.com', password, role: 'finance', plant: 'PLANT-01', isActive: true, status: 'ACTIVE' },
    { email: 'admin@test.com', password, role: 'system_admin', plant: 'PLANT-01', isActive: true, status: 'ACTIVE' },
  ];

  for (const userData of users) {
    await User.findOneAndUpdate(
      { email: userData.email },
      userData,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }
  console.log(`✅ Created ${users.length} users`);

  // 3. Create Purchase Orders
  const admin = await User.findOne({ email: 'admin@test.com' });

  const pos = [
    {
      poNumber: 'PO-2026-001', poType: 'Standard', vendorCode: 'V001', vendorName: 'Tata Projects Ltd',
      vendor_id: vendors[0]._id, companyCode: '1000', plant: 'PLANT-01',
      purchasingOrg: '1000', purchasingGroup: '001',
      documentDate: new Date(), validityDate: new Date('2027-03-31'),
      totalAmount: 5000000, grossAmount: 5000000, remaining_amount: 5000000,
      currency: 'INR', status: 'Open', isMaterial: true, createdBy: admin._id,
      lineItems: [
        { lineNumber: 1, description: 'Turbine installation services', quantity: 1, unit: 'LOT', rate: 5000000, amount: 5000000 },
      ],
    },
    {
      poNumber: 'PO-2026-002', poType: 'Service', vendorCode: 'V001', vendorName: 'Tata Projects Ltd',
      vendor_id: vendors[0]._id, companyCode: '1000', plant: 'PLANT-01',
      purchasingOrg: '1000', purchasingGroup: '001',
      documentDate: new Date(), validityDate: new Date('2027-06-30'),
      totalAmount: 2500000, grossAmount: 2500000, remaining_amount: 2500000,
      currency: 'INR', status: 'Open', isMaterial: false, createdBy: admin._id,
      lineItems: [
        { lineNumber: 1, description: 'Civil maintenance services', quantity: 12, unit: 'MTH', rate: 208333, amount: 2500000 },
      ],
    },
    {
      poNumber: 'PO-2026-003', poType: 'Standard', vendorCode: 'V002', vendorName: 'Larsen & Toubro',
      vendor_id: vendors[1]._id, companyCode: '1000', plant: 'PLANT-01',
      purchasingOrg: '1000', purchasingGroup: '001',
      documentDate: new Date(), validityDate: new Date('2027-12-31'),
      totalAmount: 10000000, grossAmount: 10000000, remaining_amount: 10000000,
      currency: 'INR', status: 'Open', isMaterial: true, createdBy: admin._id,
      lineItems: [
        { lineNumber: 1, description: 'Boiler component supply', quantity: 50, unit: 'EA', rate: 200000, amount: 10000000 },
      ],
    },
  ];

  for (const poData of pos) {
    await PurchaseOrder.findOneAndUpdate(
      { poNumber: poData.poNumber },
      poData,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }
  console.log(`✅ Created ${pos.length} Purchase Orders`);

  console.log(`
╔══════════════════════════════════════════════╗
║  🎉 Seed Complete!                          ║
║                                              ║
║  Test Credentials (password: password123)    ║
║  ─────────────────────────────────────────── ║
║  Vendor 1 : vendor1@test.com                 ║
║  Vendor 2 : vendor2@test.com                 ║
║  VPD      : vpd@test.com                     ║
║  EIC      : eic@test.com                     ║
║  VPG      : vpg@test.com                     ║
║  Finance  : finance@test.com                 ║
║  Admin    : admin@test.com                   ║
╚══════════════════════════════════════════════╝
  `);

  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
