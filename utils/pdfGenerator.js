const PDFDocument = require('pdfkit');

function generatePDF(data) {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50 });
        const buffers = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));

        // --- Header ---
        doc.fontSize(20).font('Helvetica-Bold').text('EARNINGS STATEMENT', { align: 'center' });
        doc.moveDown();

        // --- Company/School Info ---
        doc.fontSize(12).font('Helvetica-Bold').text('South Garland High School');
        doc.font('Helvetica').text('600 Colonel Dr');
        doc.text('Garland, TX 75043');
        doc.moveDown();

        // --- Employee Info ---
        doc.font('Helvetica-Bold').text('Employee Name:', { continued: true });
        doc.font('Helvetica').text(` ${data.name}`);

        doc.font('Helvetica-Bold').text('Employee ID:', { continued: true });
        doc.font('Helvetica').text(` ${data.employeeId}`);

        doc.font('Helvetica-Bold').text('Department:', { continued: true });
        doc.font('Helvetica').text(` ${data.department}`);

        doc.font('Helvetica-Bold').text('Pay Period:', { continued: true });
        doc.font('Helvetica').text(` ${data.payPeriod}`);

        doc.font('Helvetica-Bold').text('Pay Date:', { continued: true });
        doc.font('Helvetica').text(` ${data.payDate}`);

        doc.moveDown(2);

        // --- Earnings Table ---
        const tableTop = 250;
        const itemX = 50;
        const rateX = 250;
        const hoursX = 350;
        const amountX = 450;

        doc.font('Helvetica-Bold');
        doc.text('Description', itemX, tableTop);
        doc.text('Rate', rateX, tableTop);
        doc.text('Hours', hoursX, tableTop);
        doc.text('Amount', amountX, tableTop);

        doc.moveTo(itemX, tableTop + 15).lineTo(550, tableTop + 15).stroke();

        let y = tableTop + 25;
        doc.font('Helvetica');

        const items = [
            { desc: 'Regular Pay', rate: '45.00', hours: '80.00', amount: '3,600.00' },
            { desc: 'Overtime', rate: '67.50', hours: '0.00', amount: '0.00' },
            { desc: 'Stipend', rate: '-', hours: '-', amount: '500.00' }
        ];

        items.forEach(item => {
            doc.text(item.desc, itemX, y);
            doc.text(item.rate, rateX, y);
            doc.text(item.hours, hoursX, y);
            doc.text(item.amount, amountX, y);
            y += 20;
        });

        doc.moveTo(itemX, y).lineTo(550, y).stroke();
        y += 10;

        doc.font('Helvetica-Bold');
        doc.text('Total Earnings', itemX, y);
        doc.text('4,100.00', amountX, y);

        // --- Footer ---
        doc.moveDown(4);
        doc.fontSize(10).font('Helvetica-Oblique').text('This is a computer-generated document. No signature is required.', { align: 'center' });

        doc.end();
    });
}

module.exports = { generatePDF };
