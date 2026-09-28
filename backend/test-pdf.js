const mongoose = require('mongoose');
const fs = require('fs');
const { buildReportData } = require('./services/report/reportDataService');
const { renderReportTemplate } = require('./services/report/reportTemplate');
const { renderHtmlToPdf } = require('./services/report/reportRenderer');
require('dotenv').config();

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/decisionDB');
        console.log("Connected to DB");

        const Decision = require('./models/Decision');
        const dec = await Decision.findOne({});
        if (!dec) {
            console.log("No decisions in DB to test");
            process.exit(0);
        }

        console.log(`Testing with Decision ID: ${dec._id}, User: ${dec.userId}`);

        const reportData = await buildReportData(dec._id, dec.userId);
        const html = renderReportTemplate(reportData);
        
        fs.writeFileSync('test_output.html', html);
        console.log("Saved test_output.html");

        const pdfBuffer = await renderHtmlToPdf(html);
        fs.writeFileSync('test_output.pdf', pdfBuffer);
        
        console.log("Saved test_output.pdf. PDF Size:", pdfBuffer.length);
        
        process.exit(0);
    } catch (e) {
        console.error("Test failed:", e);
        process.exit(1);
    }
}

run();
