#!/bin/bash

# Script de despliegue automatizado para Exit Trading en VPS
# Uso: sudo bash deploy-vps.sh

set -e

echo "🚀 Iniciando despliegue de Exit Trading en VPS..."

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para imprimir mensajes
print_message() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Verificar que se ejecuta como root
if [ "$EUID" -ne 0 ]; then 
    print_error "Este script debe ejecutarse como root (use sudo)"
    exit 1
fi

# Actualizar sistema
print_message "Actualizando sistema..."
apt update && apt upgrade -y

# Instalar dependencias básicas
print_message "Instalando dependencias básicas..."
apt install -y curl git ufw fail2ban nginx

# Instalar Node.js 18.x
print_message "Instalando Node.js 18.x..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Verificar instalación
print_message "Verificando instalación de Node.js..."
node --version
npm --version

# Instalar PM2 globalmente
print_message "Instalando PM2..."
npm install -g pm2

# Configurar firewall
print_message "Configurando firewall..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# Configurar fail2ban
print_message "Configurando fail2ban..."
systemctl enable fail2ban
systemctl start fail2ban

# Crear directorio de la aplicación
print_message "Creando directorio de la aplicación..."
mkdir -p /var/www/exit-trading
cd /var/www/exit-trading

# Solicitar método de subida de archivos
echo ""
print_warning "¿Cómo quieres subir los archivos?"
echo "1) Git (recomendado) - necesitas tener el código en GitHub"
echo "2) Manual - usarás SCP/SFTP después"
read -p "Elige opción (1-2): " upload_method

if [ "$upload_method" = "1" ]; then
    read -p "URL de tu repositorio GitHub: " git_url
    print_message "Clonando repositorio..."
    git clone "$git_url" .
else
    print_message "Por favor sube los archivos manualmente usando SCP/SFTP a /var/www/exit-trading"
    print_message "Luego ejecuta: cd /var/www/exit-trading && npm install"
    print_message "Y continua con el script desde la instalación de dependencias"
    exit 0
fi

# Instalar dependencias
print_message "Instalando dependencias de Node.js..."
npm install

# Crear configuración de PM2
print_message "Creando configuración de PM2..."
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'exit-trading',
    script: 'src/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
EOF

# Iniciar aplicación con PM2
print_message "Iniciando aplicación con PM2..."
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Configurar Nginx
print_message "Configurando Nginx..."
read -p "Ingresa tu dominio (ej: tu-dominio.com): " domain_name

if [ -z "$domain_name" ]; then
    domain_name="localhost"
    print_warning "Usando localhost (sin HTTPS)"
fi

cat > /etc/nginx/sites-available/exit-trading << EOF
server {
    listen 80;
    server_name $domain_name www.$domain_name;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /static/ {
        alias /var/www/exit-trading/public/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Activar configuración de nginx
ln -sf /etc/nginx/sites-available/exit-trading /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Probar configuración de nginx
nginx -t

# Reiniciar nginx
systemctl restart nginx

# Preguntar sobre HTTPS
if [ "$domain_name" != "localhost" ]; then
    read -p "¿Quieres configurar HTTPS con Let's Encrypt? (y/n): " setup_https
    
    if [ "$setup_https" = "y" ]; then
        print_message "Instalando Certbot..."
        apt install -y certbot python3-certbot-nginx
        
        print_message "Obteniendo certificado SSL..."
        certbot --nginx -d $domain_name -d www.$domain_name --non-interactive --agree-tos --email admin@$domain_name
        
        # Configurar renovación automática
        certbot renew --dry-run
    fi
fi

# Crear directorio de datos
print_message "Creando directorio de datos..."
mkdir -p /var/www/exit-trading/data
chown -R www-data:www-data /var/www/exit-trading/data

# Finalización
print_message "✅ Despliegue completado exitosamente!"
echo ""
echo "📊 Información de la aplicación:"
echo "🌐 URL: http://$domain_name"
if [ "$setup_https" = "y" ]; then
    echo "🔒 HTTPS: https://$domain_name"
fi
echo "📱 PWA: Abre la URL en móvil e instala como app"
echo ""
echo "🔧 Comandos útiles:"
echo "   pm2 status              - Ver estado de la app"
echo "   pm2 logs exit-trading    - Ver logs"
echo "   pm2 restart exit-trading - Reiniciar app"
echo "   systemctl restart nginx - Reiniciar nginx"
echo ""
print_message "¡Tu app Exit Trading está lista para usar!"