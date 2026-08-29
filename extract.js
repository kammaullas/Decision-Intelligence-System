const fs = require('fs');
const html = fs.readFileSync('C:/Users/ullas/Desktop/Internship/frontend_old/index.html', 'utf8');
const match = html.match(/<style>([\s\S]*?)<\/style>/);
if (match) {
    fs.mkdirSync('C:/Users/ullas/Desktop/Internship/frontend/src', { recursive: true });
    fs.writeFileSync('C:/Users/ullas/Desktop/Internship/frontend/src/index.css', match[1]);
    console.log("Extracted CSS successfully.");
} else {
    console.log("Could not find <style> block.");
}
