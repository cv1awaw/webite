const chromium = require('@sparticuz/chromium-min');
const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');
const { generatePDF } = require('../utils/pdfGenerator');

// In-memory log storage (Note: Resets on Vercel cold start, but good enough for demo)
// For production, use a database (MongoDB/Postgres)
global.adminLogs = global.adminLogs || [];

function getRandomElement(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function generateRandomData() {
    const firstNames = ['James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph', 'Thomas', 'Charles'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
    const departments = ['Mathematics Department', 'Science Department', 'History Department', 'English Department', 'Physics Department', 'Chemistry Department'];

    return {
        firstName: getRandomElement(firstNames),
        lastName: getRandomElement(lastNames),
        department: getRandomElement(departments),
        employeeId: Math.floor(100000 + Math.random() * 900000).toString(), // 6 digits
        payPeriod: '2025-09-01 – 2025-11-30',
        payDate: '2025-11-30'
    };
}

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { url, email } = req.body;

    if (!url || !email) {
        return res.status(400).json({ error: 'Missing URL or Email' });
    }

    let browser = null;
    const logEntry = {
        timestamp: new Date().toISOString(),
        email: email,
        url: url,
        generatedName: 'Pending',
        status: 'Pending'
    };

    try {
        // 1. Generate Random Data
        const data = generateRandomData();
        const fullName = `${data.firstName} ${data.lastName}`;
        logEntry.generatedName = fullName;
        logEntry.generatedData = data;

        // 2. Generate PDF
        const pdfBuffer = await generatePDF({
            name: fullName,
            employeeId: data.employeeId,
            department: data.department,
            payPeriod: data.payPeriod,
            payDate: data.payDate
        });

        const pdfPath = '/tmp/EarningsStatement.pdf';
        fs.writeFileSync(pdfPath, pdfBuffer);

        // 3. Launch Browser
        browser = await puppeteer.launch({
            args: [...chromium.args, '--hide-scrollbars', '--disable-web-security'],
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath('https://github.com/Sparticuz/chromium/releases/download/v123.0.0/chromium-v123.0.0-pack.tar'),
            headless: chromium.headless,
            ignoreHTTPSErrors: true,
        });

        const page = await browser.newPage();

        // 4. Navigate to URL
        await page.goto(url, { waitUntil: 'networkidle2' });

        // 5. Fill Form
        // School Name
        const schoolInput = await page.$('input[aria-label="School name"]');
        if (schoolInput) {
            await schoolInput.type('South Garland High School');
            await page.waitForTimeout(1000);
            await page.keyboard.press('ArrowDown');
            await page.keyboard.press('Enter');
        }

        // First Name
        await page.type('input[name="firstName"]', data.firstName);

        // Last Name
        await page.type('input[name="lastName"]', data.lastName);

        // Email
        await page.type('input[name="email"]', email);

        // Click Verify Button
        const [button] = await page.$x("//button[contains(., 'Verify My Educator Status')]");
        if (button) {
            await button.click();
        } else {
            throw new Error('Verify button not found');
        }

        // Wait for Upload Page
        await page.waitForSelector('input[type="file"]', { timeout: 15000 });

        // Upload Generated PDF
        const inputUploadHandle = await page.$('input[type="file"]');
        await inputUploadHandle.uploadFile(pdfPath);

        // Submit Upload
        await page.waitForTimeout(2000);
        const [submitButton] = await page.$x("//button[contains(., 'Submit') or contains(., 'Upload')]");
        if (submitButton) {
            await submitButton.click();
        }

        // Wait for Success
        await page.waitForTimeout(5000);

        // Take Screenshot
        const screenshot = await page.screenshot({ encoding: 'base64' });

        await browser.close();

        // Update Log
        logEntry.status = 'Success';
        global.adminLogs.unshift(logEntry);
        if (global.adminLogs.length > 50) global.adminLogs.pop(); // Keep last 50

        res.status(200).json({ success: true, screenshot: screenshot, data: data });

    } catch (error) {
        console.error(error);
        if (browser) await browser.close();

        logEntry.status = 'Failed: ' + error.message;
        global.adminLogs.unshift(logEntry);

        res.status(500).json({ success: false, error: error.message });
    }
};
