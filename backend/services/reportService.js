const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const reportsDir = path.join(__dirname, '..', 'uploads', 'reports');
if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
}

/**
 * Generate Excel report from data
 */
exports.generateExcelReport = async (data, columns, title = 'Report') => {
    const workbook = new ExcelJS.Workbook();
    workbook.created = new Date();
    workbook.creator = 'NTPC VIMS';

    const worksheet = workbook.addWorksheet(title);

    // Header row
    worksheet.columns = columns.map(col => ({
        header: col.header,
        key: col.key,
        width: col.width || 20,
    }));

    // Style header
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1A6B3C' },
    };

    // Add data rows
    data.forEach(row => worksheet.addRow(row));

    // Auto-filter
    worksheet.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: data.length + 1, column: columns.length },
    };

    const filename = `${title.replace(/\s+/g, '_')}_${Date.now()}.xlsx`;
    const filepath = path.join(reportsDir, filename);
    await workbook.xlsx.writeFile(filepath);

    return { filename, path: `/uploads/reports/${filename}`, fullPath: filepath };
};

/**
 * Generate PDF report from data
 */
exports.generatePDFReport = async (data, columns, title = 'Report') => {
    return new Promise((resolve, reject) => {
        try {
            const filename = `${title.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
            const filepath = path.join(reportsDir, filename);
            const doc = new PDFDocument({ margin: 40, layout: 'landscape' });
            const stream = fs.createWriteStream(filepath);
            doc.pipe(stream);

            // Title
            doc.fontSize(16).fillColor('#1A6B3C').text('NTPC LIMITED', { align: 'center' });
            doc.fontSize(12).fillColor('#0D2137').text(title, { align: 'center' });
            doc.moveDown();
            doc.fontSize(8).fillColor('#999')
                .text(`Generated: ${new Date().toLocaleString('en-IN')} | Total Records: ${data.length}`, { align: 'center' });
            doc.moveDown();

            // Table header
            const colWidth = Math.min(120, (doc.page.width - 80) / columns.length);
            let x = 40;
            let y = doc.y;

            doc.rect(40, y, doc.page.width - 80, 20).fill('#1A6B3C');
            columns.forEach((col) => {
                doc.fontSize(8).fillColor('#fff').text(col.header, x + 2, y + 5, { width: colWidth - 4 });
                x += colWidth;
            });
            y += 20;

            // Table rows
            data.forEach((row, idx) => {
                if (y > doc.page.height - 60) {
                    doc.addPage();
                    y = 40;
                }

                if (idx % 2 === 0) {
                    doc.rect(40, y, doc.page.width - 80, 18).fill('#f5f5f5');
                }

                x = 40;
                columns.forEach((col) => {
                    const value = row[col.key] != null ? String(row[col.key]) : '';
                    doc.fontSize(7).fillColor('#333').text(value, x + 2, y + 4, { width: colWidth - 4 });
                    x += colWidth;
                });
                y += 18;
            });

            doc.end();
            stream.on('finish', () => resolve({ filename, path: `/uploads/reports/${filename}`, fullPath: filepath }));
            stream.on('error', reject);
        } catch (error) {
            reject(error);
        }
    });
};
