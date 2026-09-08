#!/bin/bash

# Script automatizado para compilar APK de Exit Trading
# Uso: bash scripts/build-android.sh [debug|release]

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_message() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Verificar argumentos
BUILD_TYPE=${1:-debug}

if [ "$BUILD_TYPE" != "debug" ] && [ "$BUILD_TYPE" != "release" ]; then
    print_error "Tipo de build inválido. Usa 'debug' o 'release'"
    exit 1
fi

print_message "Iniciando compilación APK ($BUILD_TYPE)..."

# Cambiar al directorio raíz del proyecto
cd "$(dirname "$0")/.."

# Paso 1: Sincronizar assets web
print_message "Sincronizando assets web con Android..."
npx cap sync android

# Paso 2: Copiar assets adicionales
print_message "Copiando assets adicionales..."
npx cap copy android

# Paso 3: Cambiar al directorio android
cd android

# Paso 4: Limpiar builds anteriores
print_message "Limpiando builds anteriores..."
./gradlew clean

# Paso 5: Compilar según tipo
if [ "$BUILD_TYPE" = "debug" ]; then
    print_message "Compilando APK Debug..."
    ./gradlew assembleDebug
    
    print_message "✅ APK Debug compilado exitosamente!"
    print_message "Ubicación: android/app/build/outputs/apk/debug/app-debug.apk"
    
    # Preguntar si quiere instalar en dispositivo conectado
    if adb devices | grep -q "device"; then
        read -p "¿Instalar en dispositivo conectado? (y/n): " install
        if [ "$install" = "y" ]; then
            print_message "Instalando APK en dispositivo..."
            adb install app/build/outputs/apk/debug/app-debug.apk
            print_message "✅ APK instalado en dispositivo"
        fi
    fi
    
else
    print_message "Compilando APK Release..."
    print_warning "Para build release necesitas configurar firma (keystore)"
    print_warning "Revisa la guía ANDROID_BUILD_GUIDE.md para configurar firma"
    
    ./gradlew assembleRelease
    
    print_message "✅ APK Release compilado exitosamente!"
    print_message "Ubicación: android/app/build/outputs/apk/release/app-release.apk"
fi

# Paso 6: Verificar APK
print_message "Verificando APK generado..."
if [ "$BUILD_TYPE" = "debug" ]; then
    APK_PATH="app/build/outputs/apk/debug/app-debug.apk"
else
    APK_PATH="app/build/outputs/apk/release/app-release.apk"
fi

if [ -f "$APK_PATH" ]; then
    APK_SIZE=$(du -h "$APK_PATH" | cut -f1)
    print_message "APK generado correctamente - Tamaño: $APK_SIZE"
else
    print_error "APK no encontrado en la ubicación esperada"
    exit 1
fi

print_message "🎉 Proceso de compilación completado!"
echo ""
echo "📱 Información del APK:"
echo "   Tipo: $BUILD_TYPE"
echo "   Ubicación: $APK_PATH"
echo "   Tamaño: $APK_SIZE"
echo ""
echo "🔧 Próximos pasos:"
echo "   1. Prueba el APK en emulador o dispositivo real"
echo "   2. Si es release, súbela a Google Play Console"
echo "   3. Completa la información para publicación"