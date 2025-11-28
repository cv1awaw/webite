const chromium = require('chrome-aws-lambda');
const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');
const { generatePDF } = require('../utils/pdfGenerator');

// ... (rest of the file until launch)

// 3. Launch Browser
browser = await chromium.puppeteer.launch({
    args: [...chromium.args, '--hide-scrollbars', '--disable-web-security'],
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath,
    headless: chromium.headless,
    ignoreHTTPSErrors: true,
});

const page = await browser.newPage();

// 4. Navigate to URL
console.log('Navigating to URL...');
await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

// 5. Fill Form
console.log('Filling form...');

// School Name
try {
    const schoolInput = await page.waitForSelector('input[aria-label="School name"]', { timeout: 10000 });
    if (schoolInput) {
        await schoolInput.type('South Garland High School');
        await page.waitForTimeout(2000); // Wait for dropdown
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('Enter');
    }
} catch (e) {
    console.log('School input issue (might be pre-filled or different selector):', e.message);
}

// First Name
await page.waitForSelector('input[name="firstName"]');
await page.type('input[name="firstName"]', data.firstName);

// Last Name
await page.type('input[name="lastName"]', data.lastName);

// Email
await page.type('input[name="email"]', email);

// Screenshot 1: Form Filled
screenshots.form_filled = await page.screenshot({ encoding: 'base64' });

// Click Verify Button
console.log('Clicking verify...');
const [button] = await page.$x("//button[contains(., 'Verify My Educator Status')]");
if (button) {
    await button.click();
} else {
    throw new Error('Verify button not found');
}

// Wait for Upload Page
console.log('Waiting for upload page...');
await page.waitForSelector('input[type="file"]', { timeout: 30000 });

// Screenshot 2: Upload Page (Before Upload)
screenshots.upload_page = await page.screenshot({ encoding: 'base64' });

// Upload Generated PDF
console.log('Uploading PDF...');
const inputUploadHandle = await page.$('input[type="file"]');
await inputUploadHandle.uploadFile(pdfPath);

// Submit Upload
await page.waitForTimeout(3000); // Wait for file to be processed
const [submitButton] = await page.$x("//button[contains(., 'Submit') or contains(., 'Upload')]");
if (submitButton) {
    await submitButton.click();
}

// Wait for Success
console.log('Waiting for success...');
await page.waitForTimeout(5000);

// Screenshot 3: Final Result
screenshots.final_result = await page.screenshot({ encoding: 'base64' });

await browser.close();

// Update Log
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

    // Try to take an error screenshot
    if (browser) {
        try {
            const pages = await browser.pages();
            if (pages.length > 0) {
                screenshots.error = await pages[0].screenshot({ encoding: 'base64' });
            }
        } catch (e) { console.error('Could not take error screenshot'); }
        await browser.close();
    }

    logEntry.status = 'Failed: ' + error.message;
    global.adminLogs.unshift(logEntry);

    res.status(500).json({
        success: false,
        error: error.message,
        screenshots: screenshots // Return whatever screenshots we captured
    });
}
};
