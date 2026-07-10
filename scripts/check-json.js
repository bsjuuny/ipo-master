const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'public/data/ipo_list.json');

if (!fs.existsSync(filePath)) {
    console.error('File not found:', filePath);
    process.exit(1);
}

const content = fs.readFileSync(filePath, 'utf8');

try {
    JSON.parse(content);
    console.log('JSON is valid!');
} catch (e) {
    console.error('JSON validation failed!');
    console.error(e.message);
    
    // Extract position from error message if possible
    const match = e.message.match(/position (\d+)/);
    if (match) {
        const pos = parseInt(match[1]);
        const start = Math.max(0, pos - 50);
        const end = Math.min(content.length, pos + 50);
        console.error('Context around error:');
        console.error('...' + content.substring(start, end) + '...');
        console.error(''.padStart(Math.min(pos, 53), ' ') + '^');
        
        // Find line and column
        const lines = content.substring(0, pos).split('\n');
        const line = lines.length;
        const column = lines[lines.length - 1].length + 1;
        console.error(`Line: ${line}, Column: ${column}`);
    }
}
