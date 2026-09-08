# 📱 Guía de Compilación APK - Exit Trading 2.0

## 🎯 Estrategia Híbrida
- **PWA**: Para acceso web desde PC (http://localhost:3000 o tu dominio)
- **APK**: Para Android con hardware completo (Google Play)

## 🛠️ Requisitos Previos

### 1. Instalar Android Studio
- Descargar: https://developer.android.com/studio
- Instalar con SDK Android 13+ (API 33+)
- Incluir Android SDK Build-Tools
- Incluir Android SDK Platform-Tools

### 2. Configurar Variables de Entorno (Windows)
```powershell
# Agregar al PATH del sistema:
C:\Users\tu_usuario\AppData\Local\Android\Sdk\platform-tools
C:\Users\tu_usuario\AppData\Local\Android\Sdk\emulator
```

### 3. Verificar instalación
```bash
adb version
```

## 📦 Paso 1: Sincronizar Web Assets

```bash
cd "G:\Exit trading"
npx cap sync android
```

## 🚀 Paso 2: Abrir en Android Studio

```bash
npx cap open android
```

Esto abrirá Android Studio con el proyecto Android.

## 🔧 Paso 3: Configurar en Android Studio

### 3.1 Gradle Sync
- Android Studio mostrará "Gradle sync needed"
- Clic en "Sync Now"
- Esperar a que complete

### 3.2 Configurar SDK
- File → Project Structure → SDK Location
- Verificar que esté apuntando a tu SDK de Android

### 3.3 Configurar AVD (Opcional - para emulador)
- Tools → Device Manager
- Create Virtual Device
- Elige Pixel 6 (recomendado)
- Descargar imagen del sistema

## 🏗️ Paso 4: Compilar APK

### 4.1 APK Debug (Para pruebas)
```bash
# En Android Studio:
Build → Build Bundle(s) → Build APK(s)
```

El APK estará en:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

### 4.2 APK Release (Para producción)
```bash
# En Android Studio:
Build → Generate Signed Bundle/APK
```

**Generar clave de firma:**
1. Elegir "APK"
2. Crear nueva keystore
3. Configurar:
   - Keystore path: `exit-trading.keystore`
   - Password: (guardarla en lugar seguro)
   - Key alias: `exit-trading`
   - Key password: (guardarla en lugar seguro)
   - Validity: 10000 días

El APK release estará en:
```
android/app/build/outputs/apk/release/app-release.apk
```

## 🧪 Paso 5: Probar en Emulador o Dispositivo Real

### 5.1 Conectar dispositivo real
1. Habilitar "Opciones de desarrollador" en tu Android
2. Habilitar "Depuración USB"
3. Conectar por USB
4. Verificar conexión:
```bash
adb devices
```

### 5.2 Ejecutar en dispositivo
```bash
# En Android Studio:
Run → Run 'app'
```

### 5.3 Instalar APK manualmente
```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

## 🎨 Paso 6: Configurar Iconos y Screenshots

### 6.1 Iconos
Los iconos PWA ya están en `public/icons/`. Capacitor los copia automáticamente.

### 6.2 Screenshots para Google Play
Necesitarás capturas de pantalla de:
- Teléfono (2+) - 6.5" o menor
- Teléfono (2+) - 6.5" o mayor
- Tablet de 7" (1+)
- Tablet de 10" (1+)

Capturar:
```bash
adb shell screencap -p /sdcard/screen.png
adb pull /sdcard/screen.png
```

## 📝 Paso 7: Configurar Google Play Console

### 7.1 Crear cuenta Google Play
1. Ir a https://play.google.com/console
2. Crear cuenta de desarrollador ($25 USD)
3. Pagar tarifa única
4. Completar información del desarrollador

### 7.2 Crear aplicación
1. "Crear aplicación"
2. Nombre: "Exit Trading - Análisis Forex"
3. Paquete: `com.exittrading.app`
4. Gratis o de pago: Gratis

### 7.3 Cargar APK
1. Ir a "Lanzamiento de producción"
2. "Crear nuevo lanzamiento"
3. Subir APK release firmado
4. Completar información

### 7.4 Información requerida:
- **Descripción corta**: 80 caracteres
- **Descripción larga**: 4000 caracteres
- **Iconos**: 512x512
- **Screenshots**: mínimo 2
- **Política de privacidad**: URL obligatoria
- **Categoría**: Finanzas

## 🔒 Paso 8: Política de Privacidad

Crear archivo simple en tu servidor:
```html
<!-- https://tu-dominio.com/privacy.html -->
<!DOCTYPE html>
<html>
<head>
    <title>Política de Privacidad - Exit Trading</title>
</head>
<body>
    <h1>Política de Privacidad</h1>
    <p>Exit Trading recopila los siguientes datos:</p>
    <ul>
        <li>Configuraciones de trading (almacenadas localmente)</li>
        <li>Historial de análisis (almacenado localmente)</li>
        <li>Imágenes de cámara/solo para análisis (no se suben a servidor)</li>
    </ul>
    <p>No compartimos datos con terceros.</p>
</body>
</html>
```

## 🚀 Paso 9: Enviar para Revisión

### 9.1 Checklist antes de enviar:
- ✅ APK compilado y firmado
- ✅ Iconos correctos
- ✅ Screenshots subidos
- ✅ Descripción completa
- ✅ Política de privacidad configurada
- ✅ Categoría correcta (Finanzas)
- ✅ Contenido clasificado (Evaluación de contenido)

### 9.2 Enviar
1. "Enviar para revisión"
2. Esperar 1-3 días
3. Responder preguntas de revisión si las hay

## 🔄 Actualizaciones

### Para actualizar la app:
```bash
# 1. Modificar código web
# 2. Sincronizar
npx cap sync android

# 3. Abrir Android Studio
npx cap open android

# 4. Compilar nueva versión
# 5. Subir nuevo APK a Google Play Console
```

## 📱 Comandos Útiles

### Sync web assets:
```bash
npx cap sync android
```

### Abrir Android Studio:
```bash
npx cap open android
```

### Copiar assets web:
```bash
npx cap copy android
```

### Actualizar plugins:
```bash
npx cap update android
```

### Limpiar build:
```bash
cd android
./gradlew clean
```

## 🎯 URL Web vs APK

### **PWA (PC/Web):**
- URL: `http://localhost:3000` (desarrollo)
- URL: `https://tu-dominio.com` (producción)
- Acceso: Inmediato desde navegador
- Actualizaciones: Automáticas

### **APK (Android):**
- Instalación: Google Play o APK manual
- Hardware: Completo (cámara, sensores, etc.)
- Actualizaciones: Via Google Play

## 💰 Costos Totales

### **Desarrollo:**
- Capacitor: Gratis
- Android Studio: Gratis
- Herramientas: Gratis

### **Publicación:**
- Cuenta Google Play: $25 USD (único pago)
- Dominio: $10-15/año (opcional)
- VPS: $6/mes (opcional para backend)

### **Total inicial:**
- **Mínimo**: $25 USD (Google Play)
- **Recomendado**: $35-40 USD (Google Play + Dominio)

## ⚠️ Problemas Comunes

### **Error: Gradle sync failed**
- Solución: File → Invalidate Caches → Invalidate and Restart

### **Error: SDK not found**
- Solución: File → Project Structure → SDK Location

### **Error: Device not found**
- Solución: Habilitar depuración USB en Android, reinstalar drivers

### **Error: Build failed**
- Solución: `./gradlew clean` luego rebuild

## 📱 Pruebas Recomendadas

### **Pruebas funcionales:**
- ✅ Análisis de trading funciona
- ✅ Cámara funciona
- ✅ Notificaciones funcionan
- ✅ Offline funciona parcialmente
- ✅ UI responde correctamente

### **Pruebas de rendimiento:**
- ✅ No consume demasiada batería
- ✅ No se congela en dispositivos bajos
- ✅ Inicio rápido

## 🎯 Checklist Final

Antes de publicar en Google Play:

**Técnico:**
- [ ] APK compila sin errores
- [ ] Firma correcta
- [ ] Mínimo SDK 21+ (Android 5.0+)
- [ ] Target SDK 33+ (Android 13+)
- [ ] Permisos justificados y necesarios
- [ ] No usa APIs obsoletas

**Contenido:**
- [ ] Iconos de alta calidad
- [ ] Screenshots profesionales
- [ ] Descripción clara y atractiva
- [ ] Política de privacidad configurada
- [ ] Categoría correcta

**Legal:**
- [ ] Cuenta de desarrollador verificada
- [ ] Información de contacto correcta
- [ ] Política de privacidad accesible
- [ ] Términos de servicio (si aplica)

---

**¡Tu APK estará listo para Google Play en aproximadamente 1-2 semanas!**