const getPalette = require('get-rgba-palette');
const getPixels = require('get-pixels');
const fs = require('fs');

getPixels('frontend/public/logo.png', function (err, pixels) {
    if (err) {
        console.log("Bad image path");
        return;
    }
    const palette = getPalette(pixels.data, 5);

    console.log("Dominant Colors:");
    palette.forEach(color => {
        const hex = '#' + color.map(c => {
            const hex = c.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('');
        console.log(hex);
    });
});
