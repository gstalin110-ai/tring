# 🚀 Exit Trading 2.0 - Sistema de Análisis Forex Inteligente Multi-Timeframe

Sistema avanzado de análisis de trading forex con inteligencia artificial que combina múltiples técnicas de análisis para proporcionar señales de trading en tiempo real.

**📱 Ahora disponible como PWA para móviles!** Instálala como app nativa desde tu navegador móvil.

## 🎯 Características Principales v2.0

### 📱 Versión PWA (Progressive Web App)
- **Instalación como App**: Instálala directamente desde el navegador móvil
- **Funcionamiento Offline**: Continúa funcionando sin conexión a internet
- **Notificaciones Push**: Alertas nativas en tu dispositivo móvil
- **Acceso a Cámara**: Usa la cámara de tu móvil para análisis visual
- **Optimizado para Táctil**: Interfaz adaptada para pantallas táctiles
- **Mismo Backend**: Usa el mismo sistema de análisis que la versión PC
- **Actualizaciones Automáticas**: Siempre con la última versión

### 🤖 Sistema de IA Multi-Análisis Integrado

### 🤖 Sistema de IA Multi-Análisis Integrado
- **Análisis Multi-Timeframe Simultáneo**: Análisis jerárquico de 9 timeframes (5s, 30s, 1m, 5m, 15m, 30m, 1h, 1d, 1w)
- **Análisis Técnico Avanzado**: Velas japonesas, indicadores técnicos (RSI, MACD, SMA, EMA, Bollinger Bands, Stochastic)
- **Análisis de Noticias**: Sentimiento de noticias financieras en tiempo real
- **Análisis Algorítmico**: 5 estrategias algorítmicas (Trend Following, Mean Reversion, Momentum, Breakout, Volume Analysis)
- **Análisis Visual Avanzado**: Procesamiento de imágenes de cámara/pantalla compartida con detección de patrones

### 🔌 Arquitectura Modular de APIs
- **Sistema de Proveedores Configurables**: Arquitectura modular para agregar/cambiar proveedores de datos
- **Proveedores Integrados**:
  - ExchangeRate API (Gratuito)
  - FreeForex API (Gratuito)
  - Frankfurter API (Gratuito - Banco Central Europeo)
  - Demo Broker API (Template para APIs de pago)
- **Selección Dinámica**: Cambiar entre proveedores sin reiniciar el sistema
- **Sistema de Fallback**: Conmutación automática entre proveedores

### ⏰ Sistema de Notificaciones Configurable
- **Intervalos Independientes**: Frecuencia de notificaciones separada de timeframes de análisis
- **Intervalos Disponibles**: 5s, 10s, 20s, 30s, 1m, 2m, 5m
- **Alertas Visuales y Sonoras**: Sistema completo de notificaciones
- **Historial de Notificaciones**: Registro completo de todas las señales

### 👁️ Sistema de Análisis Visual
- **Cámara en Tiempo Real**: Captura y análisis de video
- **Compartir Pantalla**: Análisis de gráficos de otras aplicaciones
- **Detección de Patrones**: Reconocimiento visual de velas, tendencias, soportes/resistencias
- **Integración con Datos**: Combinación de análisis visual con datos de APIs

### 📊 Análisis Multi-Timeframe Jerárquico
- **Tendencia General**: 1 semana, 1 día
- **Tendencia Diaria**: 1 día, 4 horas, 1 hora
- **Tendencia Intermedia**: 1 hora, 30 minutos, 15 minutos
- **Situación Actual**: 15 minutos, 5 minutos, 1 minuto
- **Movimiento Inmediato**: 1 minuto, 30 segundos, 5 segundos

### 💾 Sistema de Historial Persistente
- **Almacenamiento en JSON**: Historial guardado en archivos locales
- **Sesiones Completas**: Registro de sesiones con todos los análisis
- **Estadísticas Detalladas**: Métricas y análisis de rendimiento
- **Exportación a CSV**: Posibilidad de exportar datos para análisis externo

## 🛠️ Tecnologías Utilizadas

### Backend
- **Node.js** - Runtime de JavaScript
- **Express** - Framework web
- **Socket.io** - Comunicación en tiempo real
- **Sharp** - Procesamiento de imágenes
- **Jimp** - Manipulación de imágenes
- **node-cron** - Tareas programadas
- **technicalindicators** - Cálculo de indicadores técnicos

### Frontend
- **HTML5/CSS3** - Interfaz moderna y responsive
- **JavaScript (Vanilla)** - Lógica del cliente
- **Socket.io Client** - Conexión WebSocket
- **MediaDevices API** - Acceso a cámara y pantalla compartida

### APIs de Datos
- **ExchangeRate API** - Datos de tipo cambio
- **FreeForex API** - Datos forex en tiempo real
- **Frankfurter API** - Datos del Banco Central Europeo
- **Arquitectura Extensible** - Fácil agregar nuevos proveedores

## 📦 Instalación

1. **Clonar o navegar al directorio del proyecto**
   ```bash
   cd "G:\Exit trading"
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Iniciar el servidor**
   ```bash
   npm start
   ```

4. **Abrir el navegador**
   ```
   http://localhost:3000
   ```

## 🎮 Flujo de Trabajo

### 1. Configuración Pre-Inicio
Antes de iniciar el análisis, configura:

- **🔌 Conexión API**: Selecciona y prueba el proveedor de datos
- **💱 Mercado**: Selecciona uno o varios pares de divisas
- **⏱️ Temporalidades**: Elige los timeframes para análisis (múltiples permitidos)
- **🔔 Notificaciones**: Configura la frecuencia de alertas
- **👁️ Visión**: Selecciona cámara o compartir pantalla (opcional)

### 2. Iniciar Sistema
- Pulsa **🚀 INICIAR SISTEMA**
- El sistema comenzará a analizar con todas las configuraciones
- Verás el panel principal con análisis en tiempo real

### 3. Monitoreo en Tiempo Real
- **📹 Análisis Visual**: Monitor de cámara/pantalla compartida
- **📊 Resultados**: Decisiones para cada par configurado
- **📈 Análisis Detallado**: Pestañas para cada tipo de análisis
- **📜 Historial**: Registro completo de la sesión

### 4. Detener Sistema
- Pulsa **⏹️ DETENER SISTEMA**
- Todo el análisis se detiene
- La sesión se guarda en el historial

## 🔧 Configuración

### Proveedores de Datos
El sistema soporta múltiples proveedores configurables:

```javascript
// Proveedores disponibles
- exchangerate: ExchangeRate API (Gratuito)
- freeforex: FreeForex API (Gratuito)
- frankfurter: Frankfurter API (Gratuito)
- demobroker: Demo Broker API (Template para pago)
```

### Timeframes Soportados
- **5 segundos** - Scalping ultra-corto plazo
- **30 segundos** - Scalping alta frecuencia
- **1 minuto** - Corto plazo
- **5 minutos** - Corto plazo extendido
- **15 minutos** - Medio plazo
- **30 minutos** - Medio plazo extendido
- **1 hora** - Largo plazo
- **1 día** - Swing trading
- **1 semana** - Position trading

### Pesos de Análisis
Configurables en `src/services/integratedDecisionService.js`:

```javascript
this.weights = {
    multiTimeframe: 0.35,  // 35% análisis multitemporal
    news: 0.15,             // 15% noticias
    algorithmic: 0.25,      // 25% análisis algorítmico
    visual: 0.25            // 25% análisis visual
};
```

## 📡 API Endpoints

### Sistema Integrado
- `GET /api/integrated/providers` - Obtener proveedores disponibles
- `POST /api/integrated/providers/configure` - Configurar proveedor
- `GET /api/integrated/providers/:providerId/test` - Probar conexión
- `GET /api/integrated/timeframes` - Obtener timeframes disponibles
- `POST /api/integrated/start` - Iniciar sistema integrado
- `POST /api/integrated/stop` - Detener sistema integrado
- `GET /api/integrated/status` - Obtener estado del sistema

### Historial
- `GET /api/integrated/history` - Obtener historial de análisis
- `GET /api/integrated/sessions` - Obtener historial de sesiones
- `GET /api/integrated/sessions/:sessionId/analyses` - Análisis de sesión específica
- `GET /api/integrated/statistics` - Obtener estadísticas
- `POST /api/integrated/export` - Exportar historial a CSV

### Análisis Visual
- `POST /api/integrated/visual` - Procesar entrada visual

### Configuración
- `POST /api/integrated/weights` - Actualizar pesos de análisis

## 📊 Estructura del Proyecto

```
Exit trading/
├── src/
│   ├── config/
│   │   ├── apiKeys.js          # Configuración de APIs (legacy)
│   │   ├── server.js           # Configuración del servidor
│   │   └── timeframes.js       # Configuración de timeframes
│   ├── controllers/
│   │   ├── tradingController.js    # Controladores HTTP (legacy)
│   │   └── integratedController.js  # Controladores sistema integrado
│   ├── providers/
│   │   ├── BaseDataProvider.js      # Interfaz base de proveedores
│   │   ├── ExchangeRateProvider.js # Proveedor ExchangeRate
│   │   ├── FreeForexProvider.js    # Proveedor FreeForex
│   │   ├── FrankfurterProvider.js  # Proveedor Frankfurter
│   │   └── DemoBrokerProvider.js   # Template para brokers
│   ├── services/
│   │   ├── dataProviderService.js       # Gestión de proveedores
│   │   ├── forexDataService.js         # Datos forex (legacy)
│   │   ├── technicalAnalysisService.js # Análisis técnico
│   │   ├── newsAnalysisService.js      # Análisis de noticias
│   │   ├── algorithmicAnalysisService.js # Análisis algorítmico
│   │   ├── multiTimeframeAnalysisService.js # Análisis multitemporal
│   │   ├── visualAnalysisService.js   # Análisis visual avanzado
│   │   ├── decisionService.js          # Sistema de decisión (legacy)
│   │   ├── integratedDecisionService.js # Sistema integrado
│   │   └── notificationService.js       # Sistema de notificaciones
│   ├── utils/
│   │   └── historyManager.js    # Gestión de historial
│   ├── models/                 # Modelos de datos (vacío por ahora)
│   └── index.js                # Punto de entrada
├── public/
│   ├── index.html             # Interfaz web v2.0
│   ├── styles.css             # Estilos actualizados
│   └── app.js                 # Lógica del cliente v2.0
├── data/                      # Directorio de datos (historial)
├── package.json
└── README.md
```

## 🔄 Arquitectura Modular

### Sistema de Proveedores
La arquitectura permite agregar fácilmente nuevos proveedores:

1. **Crear clase extendiendo BaseDataProvider**
2. **Implementar métodos requeridos**: `getCurrentData`, `getHistoricalData`, `normalizeData`
3. **Registrar en dataProviderService**
4. **Configurar en UI**

### Análisis Multi-Timeframe
Sistema jerárquico que analiza simultáneamente:

- **Timeframes Generales**: Determinan tendencia mayor
- **Timeframes Intermedios**: Confirman tendencia
- **Timeframes Cortos**: Identifican puntos de entrada

### Integración de Análisis
Cada análisis contribuye con un peso específico:

- **Multi-Timeframe (35%)**: Análisis técnico en múltiples timeframes
- **Noticias (15%)**: Sentimiento del mercado basado en noticias
- **Algorítmico (25%)**: Estrategias cuantitativas
- **Visual (25%)**: Análisis de patrones visuales

## ⚠️ Disclaimer

**IMPORTANTE**: Este sistema es solo para fines educativos y de investigación. El trading de forex conlleva riesgos significativos y puede resultar en la pérdida de todo tu capital invertido. 

- Nunca trades con dinero que no puedes permitirte perder
- Este sistema no garantiza beneficios ni predice el mercado con certeza
- Las señales generadas son solo sugerencias basadas en análisis técnico
- Debes realizar tu propia investigación y consultar con asesores financieros calificados
- El análisis visual es experimental y puede no ser preciso

## 🚧 Próximas Mejoras

- [ ] Integración con APIs de datos forex premium (OANDA, FXCM, Interactive Brokers)
- [ ] Sistema de backtesting para estrategias
- [ ] Machine learning para optimización de pesos
- [ ] Integración con brokers para trading automatizado
- [ ] Sistema de gestión de riesgo avanzado
- [ ] Alertas por email, SMS y móvil
- [ ] Gráficos avanzados en tiempo real
- [ ] Base de datos SQLite para análisis avanzado
- [ ] Sistema de calibración de análisis visual
- [ ] Reconocimiento de patrones con TensorFlow.js

## 🤝 Contribuciones

Las contribuciones son bienvenidas. El sistema está diseñado para ser modular y extensible.

## 📝 Licencia

ISC

---

**Desarrollado con Devin AI** 🤖
*Generado con [Devin](https://devin.ai)*

**Versión 2.0** - Arquitectura Modular e Integrada