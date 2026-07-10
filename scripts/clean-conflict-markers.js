const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'public/data/ipo_list.json');
const content = fs.readFileSync(filePath, 'utf8');

// Use regex to remove common git conflict markers while keeping the 'Update upstream' or 'Stashed' version.
// Here we'll prefer the 'Stashed changes' version (between ======= and >>>>>>>) as it's likely the newer scraper data.
const cleaned = content.replace(/<<<<<<<[\s\S]*?=======([\s\S]*?)>>>>>>>[\s\S]*?\n/g, '$1');

fs.writeFileSync(filePath, cleaned, 'utf8');
console.log('JSON file cleaned of conflict markers.');
