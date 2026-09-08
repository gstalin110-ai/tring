const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Crear iconos básicos SVG para PWA
const iconsDir = path.join(__dirname, '..', 'public', 'icons');

function createIconSVG(size, color, text) {
    const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" fill="${color}" rx="${size * 0.2}"/>
    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" 
          font-family="Arial, sans-serif" font-size="${size * 0.4}" font-weight="bold" fill="white">
        🚀
    </text>
</svg>`;
    return svg;
}

function createMaskableIconSVG(size, color) {
    const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="${color}"/>
    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" 
          font-family="Arial, sans-serif" font-size="${size * 0.4}" font-weight="bold" fill="white">
        🚀
    </text>
</svg>`;
    return svg;
}

async function convertSVGToPNG(svgContent, outputPath, size) {
    try {
        await sharp(Buffer.from(svgContent))
            .resize(size, size)
            .png()
            .toFile(outputPath);
        console.log(`Creado: ${path.basename(outputPath)}`);
    } catch (error) {
        console.error(`Error creando ${path.basename(outputPath)}:`, error.message);
    }
}

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const maskableSizes = [192, 512];
const primaryColor = '#2563eb';

// Crear directorio si no existe
if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
}

async function generateIcons() {
    // Generar iconos regulares
    for (const size of sizes) {
        const svg = createIconSVG(size, primaryColor);
        const svgPath = path.join(iconsDir, `icon-${size}x${size}.svg`);
        const pngPath = path.join(iconsDir, `icon-${size}x${size}.png`);
        
        fs.writeFileSync(svgPath, svg);
        await convertSVGToPNG(svg, pngPath, size);
    }

    // Generar iconos maskable
    for (const size of maskableSizes) {
        const svg = createMaskableIconSVG(size, primaryColor);
        const svgPath = path.join(iconsDir, `icon-maskable-${size}x${size}.svg`);
        const pngPath = path.join(iconsDir, `icon-maskable-${size}x${size}.png`);
        
        fs.writeFileSync(svgPath, svg);
        await convertSVGToPNG(svg, pngPath, size);
    }

    console.log('Iconos SVG y PNG generados exitosamente');
}

generateIcons().catch(console.error);