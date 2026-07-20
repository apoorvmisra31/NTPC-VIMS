const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Generate Payment Advice PDF
 */
exports.generatePaymentAdvice = async (invoice, dpDocument) => {
    return new Promise((resolve, reject) => {
        try {
            const uploadsDir = path.join(__dirname, '..', 'uploads', 'payment-advice');
            if (!fs.existsSync(uploadsDir)) {
                fs.mkdirSync(uploadsDir, { recursive: true });
            }

            const filename = `PA-${invoice.invoiceNumber}-${Date.now()}.pdf`;
            const filepath = path.join(uploadsDir, filename);
            const doc = new PDFDocument({ margin: 50 });
            const stream = fs.createWriteStream(filepath);
            doc.pipe(stream);

            // Header
            doc.fontSize(20).fillColor('#1A6B3C').text('NTPC LIMITED', { align: 'center' });
            doc.fontSize(12).fillColor('#333').text('National Thermal Power Corporation', { align: 'center' });
            doc.moveDown();
            doc.fontSize(16).fillColor('#0D2137').text('PAYMENT ADVICE', { align: 'center' });
            doc.moveDown();

            // Line separator
            doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke('#1A6B3C');
            doc.moveDown();

            // Payment details table
            const details = [
                ['Document Number', invoice.paymentAdvice?.documentNumber || `PA-${Date.now()}`],
                ['Invoice Number', invoice.invoiceNumber],
                ['Vendor Code', invoice.vendorCode],
                ['Vendor Name', invoice.vendorName],
                ['PO Number', invoice.poNumber || 'N/A'],
                ['Company Code', invoice.companyCode],
                ['Plant', invoice.plant],
                ['Invoice Date', new Date(invoice.invoiceDate).toLocaleDateString('en-IN')],
                ['Payment Date', new Date().toLocaleDateString('en-IN')],
                ['Gross Amount', `₹ ${(invoice.grossAmount || 0).toLocaleString('en-IN')}`],
                ['Tax Amount', `₹ ${(invoice.taxAmount || 0).toLocaleString('en-IN')}`],
                ['Net Payment', `₹ ${(invoice.netAmount || invoice.grossAmount || 0).toLocaleString('en-IN')}`],
                ['Payment Method', dpDocument?.accounting?.paymentMethod || 'Q'],
                ['Payment Group', dpDocument?.otherData?.paymentGroup || 'V'],
            ];

            let y = doc.y;
            details.forEach(([label, value]) => {
                doc.fontSize(10).fillColor('#666').text(label + ':', 50, y, { width: 200 });
                doc.fontSize(10).fillColor('#000').text(value || '', 250, y, { width: 300 });
                y += 20;
            });

            doc.y = y + 20;

            // Bank details
            if (invoice.bankDetails) {
                doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke('#ccc');
                doc.moveDown();
                doc.fontSize(12).fillColor('#0D2137').text('Bank Details');
                doc.moveDown(0.5);

                const bankDetails = [
                    ['Bank Name', invoice.bankDetails.bankName],
                    ['Account Number', invoice.bankDetails.accountNumber],
                    ['IFSC Code', invoice.bankDetails.ifscCode],
                    ['Branch', invoice.bankDetails.branchName],
                ];

                y = doc.y;
                bankDetails.forEach(([label, value]) => {
                    doc.fontSize(10).fillColor('#666').text(label + ':', 50, y, { width: 200 });
                    doc.fontSize(10).fillColor('#000').text(value || '', 250, y, { width: 300 });
                    y += 18;
                });
            }

            // Footer
            doc.y = 700;
            doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke('#ccc');
            doc.moveDown();
            doc.fontSize(8).fillColor('#999')
                .text('This is a system-generated payment advice. No signature required.', { align: 'center' });
            doc.text(`Generated on ${new Date().toLocaleString('en-IN')}`, { align: 'center' });

            doc.end();

            stream.on('finish', () => {
                resolve({
                    filename,
                    path: `/uploads/payment-advice/${filename}`,
                    fullPath: filepath,
                });
            });

            stream.on('error', reject);
        } catch (error) {
            reject(error);
        }
    });
};

/**
 * Generate DP Document PDF
 */
exports.generateDPDocumentPDF = async (dpDocument) => {
    return new Promise((resolve, reject) => {
        try {
            const uploadsDir = path.join(__dirname, '..', 'uploads', 'dp-documents');
            if (!fs.existsSync(uploadsDir)) {
                fs.mkdirSync(uploadsDir, { recursive: true });
            }

            const filename = `${dpDocument.dpId}.pdf`;
            const filepath = path.join(uploadsDir, filename);
            const doc = new PDFDocument({ margin: 50 });
            const stream = fs.createWriteStream(filepath);
            doc.pipe(stream);

            doc.fontSize(18).fillColor('#1A6B3C').text('NTPC VIMS - DP Document', { align: 'center' });
            doc.moveDown();
            doc.fontSize(14).fillColor('#0D2137').text(`DP-ID: ${dpDocument.dpId}`, { align: 'center' });
            doc.moveDown();

            // Basic data
            doc.fontSize(12).fillColor('#333').text('Basic Data');
            doc.moveDown(0.5);
            const basicFields = [
                ['Vendor', dpDocument.basicData?.vendorName],
                ['PO Number', dpDocument.basicData?.poNumber],
                ['Company Code', dpDocument.basicData?.companyCode],
                ['Gross Amount', `₹ ${(dpDocument.basicData?.grossAmount || 0).toLocaleString('en-IN')}`],
                ['Status', dpDocument.status],
                ['Stage', dpDocument.workflow?.currentStage],
            ];

            let y = doc.y;
            basicFields.forEach(([label, value]) => {
                doc.fontSize(9).fillColor('#666').text(label + ':', 50, y, { width: 150 });
                doc.fontSize(9).fillColor('#000').text(value || 'N/A', 200, y, { width: 350 });
                y += 16;
            });

            doc.end();
            stream.on('finish', () => resolve({ filename, path: `/uploads/dp-documents/${filename}` }));
            stream.on('error', reject);
        } catch (error) {
            reject(error);
        }
    });
};
