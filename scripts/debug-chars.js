const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'public/data/ipo_list.json');
const content = fs.readFileSync(filePath, 'utf8');

console.log('Total length:', content.length);

const pos = 236;
const start = Math.max(0, pos - 20);
const end = Math.min(content.length, pos + 20);

console.log(`Context [${start}-${end}]:`);
for (let i = start; i < end; i++) {
    const char = content[i];
    const code = char.charCodeAt(0);
    let desc = char;
    if (code === 10) desc = '\\n';
    if (code === 13) desc = '\\r';
    if (code === 32) desc = '(space)';
    console.log(`${i}: code=${code} char=[${desc}]`);
}
