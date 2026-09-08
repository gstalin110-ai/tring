const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Directorios
const iconsDir = path.join(__dirname, '..', 'public', 'icons');
const androidResDir = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res');

// Tamaños requeridos para Android
const androidSizes = [
    { name: 'mipmap-mdpi', size: 48, path: 'mipmap-mdpi' },
    { name: 'mipmap-hdpi', size: 72, path: 'mipmap-hdpi' },
    { name: 'mipmap-xhdpi', size: 96, path: 'mipmap-xhdpi' },
    { name: 'mipmap-xxhdpi', size: 144, path: 'mipmap-xxhdpi' },
    { name: 'mipmap-xxxhdpi', size: 192, path: 'mipmap-xxxhdpi' },
    { name: 'mipmap-xxxxhdpi', size: 512, path: 'mipmap-xxxxhdpi' }
];

function createIconSVG(size, color) {
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

async function generateAndroidIcons() {
    console.log('Generando iconos para Android...');
    
    try {
        // Crear directorios mipmap si no existen
        for (const { path: mipmapPath } of androidSizes) {
            const targetDir = path.join(androidResDir, mipmapPath);
            if (!fs.existsSync(targetDir)) {
                fs.mkdirSync(targetDir, { recursive: true });
            }
        }
        
        // Generar iconos launcher
        const sourceIcon = path.join(iconsDir, 'icon-512x512.png');
        
        for (const { name, size, path: mipmapPath } of androidSizes) {
            const targetDir = path.join(androidResDir, mipmapPath);
            
            // ic_launcher.png
            await sharp(sourceIcon)
                .resize(size, size)
                .png()
                .toFile(path.join(targetDir, 'ic_launcher.png'));
            
            // ic_launcher_round.png
            await sharp(sourceIcon)
                .resize(size, size)
                .png()
                .toFile(path.join(targetDir, 'ic_launcher_round.png'));
            
            console.log(`Creado: ${name} (${size}x${size})`);
        }
        
        // Generar playstore icon (512x512)
        const playstoreDir = path.join(androidResDir, 'mipmap-xxxhdpi');
        await sharp(sourceIcon)
            .resize(512, 512)
            .png()
            .toFile(path.join(playstoreDir, 'ic_launcher_playstore.png'));
        
        console.log('Creado: ic_launcher_playstore.png (512x512)');
        
        console.log('✅ Iconos Android generados exitosamente');
        
    } catch (error) {
        console.error('Error generando iconos Android:', error.message);
        throw error;
    }
}

generateAndroidIcons().catch(console.error);