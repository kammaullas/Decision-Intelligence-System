const { chromium } = require('playwright');

/**
 * Renders an HTML string into a PDF Buffer using Playwright Chromium.
 * 
 * @param {string} htmlContent - The complete HTML string to render.
 * @returns {Promise<Buffer>} - The generated PDF buffer.
 */
async function renderHtmlToPdf(htmlContent) {
    let browser;
    try {
        browser = await chromium.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        });
        const context = await browser.newContext();
        const page = await context.newPage();

        // Set content and wait for network idle to ensure fonts/styles load
        await page.setContent(htmlContent, { waitUntil: 'networkidle' });

        // Wait a tiny bit extra for fonts if needed, though networkidle usually suffices for web fonts
        await page.waitForTimeout(500);

        // Generate PDF
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            displayHeaderFooter: true,
            headerTemplate: `
                <div style="font-size: 8px; font-family: 'Inter', sans-serif; color: #888; text-transform: uppercase; letter-spacing: 1px; display: flex; justify-content: space-between; width: 100%; padding: 0 40px; margin-bottom: 20px;">
                    <span class="title">Decision Intelligence Report</span>
                    <span class="date"></span>
                </div>
            `,
            footerTemplate: `
                <div style="font-size: 8px; font-family: 'Inter', sans-serif; color: #888; display: flex; justify-content: space-between; width: 100%; padding: 20px 40px 0 40px; border-top: 1px solid #E5E0DA; margin: 0 40px;">
                    <span>Decision Intelligence Platform | Private & Confidential</span>
                    <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
                </div>
            `,
            margin: {
                top: '70px',
                right: '0',
                bottom: '70px',
                left: '0'
            }
        });

        return pdfBuffer;
    } catch (error) {
        console.error("PDF Generation Error (Playwright):", error);
        throw error;
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

module.exports = { renderHtmlToPdf };
