const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');
const { generatePDF } = require('../utils/pdfGenerator');

// In-memory log storage
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
        employeeId: Math.floor(100000 + Math.random() * 900000).toString(),
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
    const screenshots = {};
    const logEntry = {
        timestamp: new Date().toISOString(),
        email: email,
        url: url,
        generatedName: 'Pending',
        status: 'Pending',
        steps: [], // Breadcrumbs
        errorDetails: null
    };

    const addStep = (msg) => {
        console.log(msg);
        logEntry.steps.push(`${new Date().toISOString().split('T')[1].slice(0, 8)} - ${msg}`);
    };

    try {
        addStep('Starting verification...');

        // 1. Generate Data
        const data = generateRandomData();
        const fullName = `${data.firstName} ${data.lastName}`;
        logEntry.generatedName = fullName;
        logEntry.generatedData = data;
        addStep(`Generated Data: ${fullName}`);

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
        addStep('PDF Generated and Saved');

        // 3. Launch Browser (v119 Config)
        addStep('Launching Browser...');
        browser = await puppeteer.launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath(),
            headless: chromium.headless,
            ignoreHTTPSErrors: true,
        });
        addStep('Browser Launched Successfully');

        const page = await browser.newPage();

        // 4. Navigate
        addStep(`Navigating to URL: ${url}`);
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
        addStep('Page Loaded');

        // 5. Fill Form
        addStep('Filling Form...');
        try {
            const schoolInput = await page.waitForSelector('input[aria-label="School name"]', { timeout: 10000 });
            if (schoolInput) {
                await schoolInput.type('South Garland High School');
                await page.waitForTimeout(2000);
                await page.keyboard.press('ArrowDown');
                await page.keyboard.press('Enter');
                addStep('School Name Filled');
            }
        } catch (e) {
            addStep(`School Input Warning: ${e.message}`);
        }

        await page.waitForSelector('input[name="firstName"]');
        await page.type('input[name="firstName"]', data.firstName);
        await page.type('input[name="lastName"]', data.lastName);
        await page.type('input[name="email"]', email);
        addStep('Personal Info Filled');

        screenshots.form_filled = await page.screenshot({ encoding: 'base64' });

        // Click Verify
        const [button] = await page.$x("//button[contains(., 'Verify My Educator Status')]");
        if (button) {
            await button.click();
            addStep('Verify Button Clicked');
        } else {
            throw new Error('Verify button not found');
        }

        // Upload
        addStep('Waiting for Upload Page...');
        await page.waitForSelector('input[type="file"]', { timeout: 30000 });
        screenshots.upload_page = await page.screenshot({ encoding: 'base64' });

        const inputUploadHandle = await page.$('input[type="file"]');
        await inputUploadHandle.uploadFile(pdfPath);
        addStep('PDF Uploaded');

        await page.waitForTimeout(3000);
        const [submitButton] = await page.$x("//button[contains(., 'Submit') or contains(., 'Upload')]");
        if (submitButton) {
            await submitButton.click();
            addStep('Submit Button Clicked');
        }

        // Success
        await page.waitForTimeout(5000);
        screenshots.final_result = await page.screenshot({ encoding: 'base64' });
        addStep('Verification Completed');

        await browser.close();

        logEntry.status = 'Success';
        global.adminLogs.unshift(logEntry);
        if (global.adminLogs.length > 50) global.adminLogs.pop();

        res.status(200).json({
            success: true,
            screenshots: screenshots,
            data: data
        });

    } catch (error) {
        console.error('Verification Error:', error);
        addStep(`ERROR: ${error.message}`);

        if (browser) {
            try {
                const pages = await browser.pages();
                if (pages.length > 0) {
                    screenshots.error = await pages[0].screenshot({ encoding: 'base64' });
                }
            } catch (e) { }
            await browser.close();
        }

        logEntry.status = 'Failed';
        logEntry.errorDetails = error.stack || error.message;
        global.adminLogs.unshift(logEntry);

        res.status(500).json({
            success: false,
            error: error.message,
            screenshots: screenshots
        });
    }
};
