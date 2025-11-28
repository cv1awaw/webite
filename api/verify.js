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

        // 6. Navigation
        addStep(`Navigating to: ${url}`);
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
        addStep('Page Loaded');

        // 7. Form Filling
        addStep('✍️ Filling Form Data...');

        // School Logic - Specific for South Garland High School
        try {
            const schoolInput = await page.waitForSelector('input[aria-label="School name"]', { timeout: 10000 });
            if (schoolInput) {
                await schoolInput.type('South Garland High School');
                await page.waitForTimeout(2000); // Wait for dropdown
                await page.keyboard.press('ArrowDown');
                await page.keyboard.press('Enter');
                addStep('School Selected: South Garland High School');
            }
        } catch (e) {
            addStep('Note: School input skipped or not found');
        }

        await page.type('input[name="firstName"]', data.firstName);
        await page.type('input[name="lastName"]', data.lastName);
        await page.type('input[name="email"]', email);

        // Handle Confirm Email if it exists
        try {
            const confirmEmail = await page.$('input[name="confirmEmail"]');
            if (confirmEmail) await confirmEmail.type(email);
        } catch (e) { }

        addStep('Personal Info Entered');

        // Checkboxes (Terms)
        try {
            const checkboxes = await page.$$('input[type="checkbox"]');
            for (const box of checkboxes) {
                await box.click();
            }
        } catch (e) { }

        screenshots.form_filled = await page.screenshot({ encoding: 'base64' });

        // 8. Verify Button
        const [verifyBtn] = await page.$x("//button[contains(., 'Verify My Educator Status') or contains(., 'Submit')]");
        if (!verifyBtn) throw new Error('Verify button not found');
        await verifyBtn.click();
        addStep('Verify Button Clicked');

        // 9. Upload
        addStep('Waiting for Upload Screen...');
        try {
            await page.waitForSelector('input[type="file"]', { timeout: 30000 });
            screenshots.upload_page = await page.screenshot({ encoding: 'base64' });

            const uploader = await page.$('input[type="file"]');
            await uploader.uploadFile(pdfPath);
            addStep('📤 PDF Uploaded');

            await page.waitForTimeout(2000);
            // Look for submit button after upload (often changes text)
            const [submitUploadBtn] = await page.$x("//button[contains(., 'Submit') or contains(., 'Upload')]");
            if (submitUploadBtn) {
                await submitUploadBtn.click();
                addStep('Upload Submit Button Clicked');
            }
        } catch (e) {
            addStep('⚠️ Upload step issue: ' + e.message);
        }

        // 10. Success
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
