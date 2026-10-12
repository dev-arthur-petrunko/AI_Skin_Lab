const fs = require('fs');
const c = fs.readFileSync('frontend/src/components/ProductCard.tsx', 'utf8');
const idx = c.indexOf('<div className="pic');
console.log('Index:', idx);
console.log('Context:', JSON.stringify(c.substring(idx, idx + 80)));
console.log('Line 58:', JSON.stringify(c.split('\n')[57]));
console.log('Line 58 length:', c.split('\n')[57].length);
console.log('Char codes:', c.split('\n')[57].split('').map((ch, i) => ch.charCodeAt(0) + ':' + ch).join(' '));