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
    
    // Replace incorrectly closed single quotes on fetch calls using VITE_API_URL
    let newContent = content;
    newContent = newContent.replace(/(\/api\/[a-zA-Z0-9-]*)\', \{/g, "$1\`, {");
    
    if (content !== newContent) {
        fs.writeFileSync(file, newContent, 'utf8');
        changedCount++;
        console.log(`Updated ${path.relative(process.cwd(), file)}`);
    }
});

console.log(`Finished. Updated ${changedCount} files.`);
