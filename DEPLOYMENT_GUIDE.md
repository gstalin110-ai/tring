# 🚀 Guía de Despliegue VPS para Exit Trading 2.0

## 📋 Requisitos Previos

### 1. Elegir Proveedor VPS
**Opciones recomendadas:**
- **DigitalOcean** - $5/mes, muy fácil de usar
- **Linode** - $5/mes, buen rendimiento
- **AWS EC2** - 12 meses gratis, más complejo
- **Vultr** - $3.5/mes, económico

### 2. Necesitarás:
- Tarjeta de crédito
- Dominio propio (opcional pero recomendado)
- Cliente SSH (PuTTY en Windows, Terminal en Mac/Linux)

## 🔧 Paso 1: Crear VPS en DigitalOcean

### 1.1 Crear cuenta:
1. Ve a https://www.digitalocean.com
2. Regístrate con tu email
3. Verifica tu email

### 1.2 Crear Droplet (VPS):
1. Clic en "Create" → "Droplets"
2. Elige ubicación (recomendado: Nueva York o San Francisco)
3. Elige imagen: "Ubuntu 22.04 LTS"
4. Elige plan: "Basic" → "$6/mes" (1GB RAM, 1 vCPU, 25GB SSD)
5. Elige autenticación: SSH Key (recomendado) o Password
6. Asigna hostname: `exit-trading-server`
7. Crea el Droplet

## 🔧 Paso 2: Configurar el Servidor

### 2.1 Conectar por SSH:
```bash
# En Windows con PuTTY:
# Host: tu_droplet_ip
# Port: 22
# Usuario: root
# Password: el que configuraste

# En Mac/Linux:
ssh root@tu_droplet_ip
```

### 2.2 Actualizar servidor:
```bash
apt update && apt upgrade -y
```

### 2.3 Instalar Node.js:
```bash
# Instalar Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Verificar instalación
node --version
npm --version
```

### 2.4 Instalar otras dependencias:
```bash
# Instalar git
apt install -y git

# Instalar nginx (servidor web)
apt install -y nginx

# Instar PM2 (gestor de procesos Node.js)
npm install -g pm2
```

## 🔧 Paso 3: Configurar Firewall

```bash
# Configurar firewall (ufw)
ufw allow 22    # SSH
ufw allow 80    # HTTP
ufw allow 443   # HTTPS
ufw enable
```

## 🔧 Paso 4: Subir tu Aplicación

### 4.1 Crear directorio:
```bash
mkdir -p /var/www/exit-trading
cd /var/www/exit-trading
```

### 4.2 Subir archivos:
**Opción A: Usar Git (RECOMENDADO)**
```bash
# En tu PC local:
cd "G:\Exit trading"
git init
git add .
git commit -m "Initial commit"

# En DigitalOcean (crear repo en GitHub primero):
git clone https://github.com/tu-usuario/exit-trading.git
```

**Opción B: Usar SCP (Windows)**
```bash
# En Windows con PowerShell:
scp -r "G:\Exit trading\*" root@tu_droplet_ip:/var/www/exit-trading/
```

**Opción C: Usar SFTP (FileZilla)**
1. Conecta con FileZilla a tu VPS
2. Arrastra los archivos a `/var/www/exit-trading`

### 4.3 Instalar dependencias:
```bash
cd /var/www/exit-trading
npm install
```

## 🔧 Paso 5: Configurar PM2

```bash
# Crear archivo ecosystem para PM2
nano ecosystem.config.js
```

**Contenido de ecosystem.config.js:**
```javascript
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
```

```bash
# Iniciar aplicación con PM2
pm2 start ecosystem.config.js

# Configurar para que inicie automáticamente al reiniciar
pm2 startup
pm2 save
```

## 🔧 Paso 6: Configurar Nginx

### 6.1 Crear configuración:
```bash
nano /etc/nginx/sites-available/exit-trading
```

**Contenido:**
```nginx
server {
    listen 80;
    server_name tu-dominio.com www.tu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Para servir archivos estáticos directamente
    location /static/ {
        alias /var/www/exit-trading/public/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Para Socket.io
    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 6.2 Activar configuración:
```bash
ln -s /etc/nginx/sites-available/exit-trading /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx
```

## 🔧 Paso 7: Configurar Dominio y HTTPS

### 7.1 Configurar dominio:
1. Compra dominio en Namecheap, GoDaddy, etc.
2. Apunta DNS a tu IP de DigitalOcean:
   - A record: `@` → tu_droplet_ip
   - A record: `www` → tu_droplet_ip

### 7.2 Instalar Certbot para HTTPS:
```bash
apt install -y certbot python3-certbot-nginx
```

### 7.3 Obtener certificado SSL:
```bash
certbot --nginx -d tu-dominio.com -d www.tu-dominio.com
```

### 7.4 Renovación automática:
```bash
certbot renew --dry-run
```

## 🔧 Paso 8: Verificar Funcionamiento

### 8.1 Verificar aplicación:
```bash
pm2 status
pm2 logs exit-trading
```

### 8.2 Verificar nginx:
```bash
systemctl status nginx
```

### 8.3 Verificar SSL:
```bash
curl https://tu-dominio.com
```

## 📱 Paso 9: Probar PWA en Móvil

### 9.1 En tu móvil:
1. Abre Chrome o Safari
2. Navega a `https://tu-dominio.com`
3. Verás opción "Agregar a pantalla de inicio"
4. Instálala como app

### 9.2 Verificar PWA:
- Abre Chrome DevTools en tu PC
- Ve a Application → PWA
- Verifica que todo esté correcto

## 🔧 Paso 10: Mantenimiento

### Actualizar aplicación:
```bash
cd /var/www/exit-trading
git pull
npm install
pm2 restart exit-trading
```

### Verificar logs:
```bash
pm2 logs exit-trading
```

### Reiniciar servidor:
```bash
pm2 restart exit-trading
systemctl restart nginx
```

## 💰 Costos Estimados

- **VPS DigitalOcean**: $6/mes
- **Dominio**: $10-15/año
- **Total**: ~$7-8/mes

## 🚀 Compartir tu App

Una vez configurado, simplemente comparte:
- URL: `https://tu-dominio.com`
- Instrucciones: "Abre este enlace en tu móvil y selecciona 'Agregar a pantalla de inicio'"

## ⚠️ Seguridad Adicional

### Firewall adicional:
```bash
# Solo permitir tu IP para SSH (reemplaza con tu IP)
ufw allow from tu_ip to any port 22
```

### Actualizaciones automáticas:
```bash
apt install unattended-upgrades
dpkg-reconfigure -plow unattended-upgrades
```

## 📞 Soporte

Si tienes problemas:
- DigitalOcean Community Tutorials
- PM2 Documentation
- Nginx Documentation

---

**¡Tu app estará disponible 24/7 como PWA para cualquier usuario con el link!**