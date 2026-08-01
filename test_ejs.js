
const ejs = require('ejs');
const fs = require('fs');
try {
    const template = fs.readFileSync('views/pannl/gallery.ejs', 'utf-8');
    ejs.compile(template)({
        grouped_images: {},
        getText: (k) => k
    });
    console.log('EJS Compiled successfully');
} catch (e) {
    console.error('EJS Error:', e.message);
}
