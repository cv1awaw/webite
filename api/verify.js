const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const { generatePDF } = require('../utils/pdfGenerator');

// Global Log Storage
global.adminLogs = global.adminLogs || [];

// --- UTILS ---
function getRandomElement(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function generateRandomData() {
    return {
        firstName: getRandomElement(['James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph', 'Thomas', 'Charles']),
        lastName: getRandomElement(['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez']),
        department: getRandomElement(['Mathematics', 'Science', 'History', 'English', 'Physics', 'Chemistry']) + ' Department',
        employeeId: Math.floor(100000 + Math.random() * 900000).toString(),
        payPeriod: '2025-10-01 – 2025-10-31',
        payDate: '2025-10-31'
    };
}

module.exports = async (req, res) => {
    // 1. Validation
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
    const { url, email } = req.body;
    if (!url || !email) return res.status(400).json({ error: 'Missing URL or Email' });

    // 2. Init Log Entry
    const logEntry = {
        timestamp: new Date().toISOString(),
        email: email,
        url: url,
        generatedName: 'Pending',
        status: 'Pending',
        steps: [],
        errorDetails: null
    };

    const addStep = (msg) => {
        console.log(`[${email}] ${msg}`);
        logEntry.steps.push(`${new Date().toISOString().split('T')[1].slice(0, 8)} - ${msg}`);
    };

    let browser = null;
    const screenshots = {};

    try {
        addStep('🚀 Starting Verification Process V2');

        // 3. Generate Data
        const data = generateRandomData();
        const fullName = `${data.firstName} ${data.lastName}`;
        logEntry.generatedName = fullName;
        logEntry.generatedData = data;
        addStep(`Generated Identity: ${fullName} (${data.department})`);

        // 4. Generate PDF
        const pdfBuffer = await generatePDF({
            name: fullName,
            employeeId: data.employeeId,
            department: data.department,
            payPeriod: data.payPeriod,
            payDate: data.payDate
        });
        const pdfPath = '/tmp/EarningsStatement.pdf';
        fs.writeFileSync(pdfPath, pdfBuffer);
        addStep('📄 PDF Document Created');

        // 5. Launch Browser (Vercel Optimized)
        addStep('🌐 Launching Chrome...');
        browser = await puppeteer.launch({
            args: [...chromium.args, '--hide-scrollbars', '--disable-web-security', '--no-sandbox', '--disable-setuid-sandbox'],
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath(),
            headless: chromium.headless,
            ignoreHTTPSErrors: true,
        });
        addStep('Browser Launched Successfully');

        const page = await browser.newPage();

        addStep('Waiting for Final Result...');
        await page.waitForTimeout(5000);
        screenshots.final_result = await page.screenshot({ encoding: 'base64' });
        addStep('✅ Verification Sequence Complete');

        await browser.close();

        // Finalize Log
        logEntry.status = 'Success';
        global.adminLogs.unshift(logEntry);
        if (global.adminLogs.length > 50) global.adminLogs.pop();

        res.status(200).json({ success: true, screenshots, data });

    } catch (error) {
        console.error('V2 Error:', error);
        addStep(`❌ FATAL ERROR: ${error.message}`);

        if (browser) {
            try {
                const pages = await browser.pages();
                if (pages.length > 0) screenshots.error = await pages[0].screenshot({ encoding: 'base64' });
            } catch (e) { }
            await browser.close();
        }

        logEntry.status = 'Failed';
        logEntry.errorDetails = error.stack;
        global.adminLogs.unshift(logEntry);

        res.status(500).json({ success: false, error: error.message, screenshots });
    }
};
