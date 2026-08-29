/* eslint-env node */
import fs from 'fs';
import path from 'path';

const srcDir = path.join(process.cwd(), 'src');

function walkDir(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach((file) => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walkDir(file));
        } else { 
            if (file.endsWith('.js') || file.endsWith('.jsx')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walkDir(srcDir);
let changedCount = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    // Replace standard fetches
    const newContent1 = content.replace(/'http:\/\/localhost:5000/g, '`${import.meta.env.VITE_API_URL || "http://localhost:5000"}');
    
    // Replace template literal fetches
    const newContent2 = newContent1.replace(/`http:\/\/localhost:5000/g, '`${import.meta.env.VITE_API_URL || "http://localhost:5000"}');

    if (content !== newContent2) {
        fs.writeFileSync(file, newContent2, 'utf8');
        changedCount++;
        console.log(`Updated ${path.relative(process.cwd(), file)}`);
    }
});

console.log(`Finished. Updated ${changedCount} files.`);
