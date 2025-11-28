const PDFDocument = require('pdfkit');
const fs = require('fs');

function generatePDF(data) {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const buffers = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
            const pdfData = Buffer.concat(buffers);
            resolve(pdfData);
        });

        // --- Header ---
        doc.font('Helvetica-Bold').fontSize(12).text('SOUTH GARLAND, LTD.', 50, 50);
        doc.font('Helvetica').fontSize(10).text('South Garland High School');
        doc.text('600 Colonel Dr');
        doc.text('Garland, TX 75043');

        doc.font('Helvetica-Bold').fontSize(20).fillColor('#003399')
            .text('EARNINGS', 400, 50, { align: 'right' })
            .text('STATEMENT', 400, 75, { align: 'right' });

        doc.fillColor('black');
        doc.moveTo(50, 110).lineTo(550, 110).strokeColor('#e0e0e0').stroke();

        // --- Employee Info & Pay Summary ---
        const yInfo = 130;

        // Left Column
        doc.font('Helvetica-Bold').fontSize(11).text('EMPLOYEE INFORMATION', 50, yInfo);
        doc.font('Helvetica').fontSize(10).text(`Name: ${data.name}`, 50, yInfo + 20);
        doc.text(`Employee ID: ${data.employeeId}`, 50, yInfo + 35);
        doc.text(`Department: ${data.department}`, 50, yInfo + 50);
        doc.text('Position: Teacher', 50, yInfo + 65);
        doc.text('Status: Full-time Active Faculty', 50, yInfo + 80);

        // Right Column
        doc.font('Helvetica-Bold').fontSize(11).text('PAY SUMMARY', 350, yInfo);
        doc.font('Helvetica').fontSize(10).text(`Pay Period: ${data.payPeriod}`, 350, yInfo + 20);
        doc.text(`Pay Date: ${data.payDate}`, 350, yInfo + 35);

        // --- Table ---
        const yTable = 240;
        const colWidths = [180, 50, 60, 70, 180, 70]; // Adjusted widths
        const xPositions = [50, 230, 280, 340, 410, 590]; // Approximate X positions

        // Table Header Background
        doc.rect(50, yTable, 500, 40).fill('#f0f0f0');
        doc.fillColor('black');

        // Main Headers
        doc.font('Helvetica-Bold').fontSize(10);
        doc.text('EARNINGS', 55, yTable + 5);
        doc.text('DEDUCTIONS', 365, yTable + 5); // Adjusted X

        // Sub Headers
        const ySub = yTable + 20;
        doc.text('Description', 55, ySub);
        doc.text('Hours', 235, ySub, { width: 40, align: 'right' });
        doc.text('Rate', 285, ySub, { width: 50, align: 'right' });
        doc.text('Amount', 345, ySub, { width: 60, align: 'right' });

        doc.text('Description', 415, ySub);
        doc.text('Amount', 485, ySub, { width: 60, align: 'right' });

        // Borders for Header
        doc.rect(50, yTable, 500, 40).stroke(); // Outer
        doc.moveTo(50, ySub - 2).lineTo(550, ySub - 2).stroke(); // Middle H
        doc.moveTo(410, yTable).lineTo(410, yTable + 40).stroke(); // Middle V

        // Data Rows
        let yRow = yTable + 40;
        const rowHeight = 20;

        const earnings = [
            { desc: 'Base Salary', hours: '-', rate: '-', amount: '$5,000.00' },
            { desc: 'Overtime', hours: '10', rate: '$40/hr', amount: '$400.00' },
            { desc: 'Bonus', hours: '-', rate: '-', amount: '$300.00' },
            { desc: '', hours: '', rate: '', amount: '' },
            { desc: '', hours: '', rate: '', amount: '' },
            { desc: '', hours: '', rate: '', amount: '' }
        ];

        const deductions = [
            { desc: 'Federal Tax', amount: '$850.00' },
            { desc: 'State Tax', amount: '$240.00' },
            { desc: 'Social Security', amount: '$353.40' },
            { desc: 'Medicare', amount: '$82.65' },
            { desc: 'Health Insurance', amount: '$150.00' },
            { desc: 'Retirement (401k)', amount: '$200.00' }
        ];

        doc.font('Helvetica').fontSize(10);

        for (let i = 0; i < 6; i++) {
            // Draw Row Borders
            doc.rect(50, yRow, 500, rowHeight).stroke();
            doc.moveTo(410, yRow).lineTo(410, yRow + rowHeight).stroke(); // Middle V

            // Earnings Data
            if (earnings[i]) {
                doc.text(earnings[i].desc, 55, yRow + 5);
                doc.text(earnings[i].hours, 235, yRow + 5, { width: 40, align: 'right' });
                doc.text(earnings[i].rate, 285, yRow + 5, { width: 50, align: 'right' });
                doc.text(earnings[i].amount, 345, yRow + 5, { width: 60, align: 'right' });
            }

            // Deductions Data
            if (deductions[i]) {
                doc.text(deductions[i].desc, 415, yRow + 5);
                doc.text(deductions[i].amount, 485, yRow + 5, { width: 60, align: 'right' });
            }

            yRow += rowHeight;
        }

        // Totals Row
        doc.rect(50, yRow, 500, rowHeight).fill('#f5f5f5').stroke();
        doc.fillColor('black').font('Helvetica-Bold');

        doc.text('Total Gross:', 235, yRow + 5, { width: 100, align: 'right' }); // Adjusted X
        doc.text('$5,700.00', 345, yRow + 5, { width: 60, align: 'right' });

        doc.text('Total Deductions:', 415, yRow + 5);
        doc.text('$1,876.05', 485, yRow + 5, { width: 60, align: 'right' });

        // --- Footer ---
        const yFooter = yRow + 50;

        // YTD
        doc.font('Helvetica-Bold').fontSize(11).text('YEAR-TO-DATE (YTD)', 50, yFooter);
        doc.font('Helvetica').fontSize(10);
        doc.text('YTD Gross Pay:', 50, yFooter + 25);
        doc.text('$11,400.00', 150, yFooter + 25);
        doc.text('YTD Deductions:', 50, yFooter + 40);
        doc.text('$3,752.10', 150, yFooter + 40);
        doc.text('YTD Net Pay:', 50, yFooter + 55);
        doc.text('$7,647.90', 150, yFooter + 55);

        // Net Pay Distribution
        doc.font('Helvetica-Bold').fontSize(11).text('NET PAY DISTRIBUTION', 350, yFooter, { align: 'center', width: 200 });

        // Green Box
        doc.rect(350, yFooter + 20, 200, 50).fill('#1b5e20');
        doc.fillColor('white').fontSize(20).text('$3,823.95', 350, yFooter + 35, { align: 'center', width: 200 });

        // Disclaimer
        doc.fillColor('#808080').fontSize(8).font('Helvetica-Oblique');
        doc.text('This document is a representation of earnings and deductions for the period specified. Please retain for your records.', 50, 750, { align: 'center', width: 500 });

        doc.end();
    });
}

module.exports = { generatePDF };
