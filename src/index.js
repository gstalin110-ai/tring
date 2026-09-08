const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cron = require('node-cron');
const tradingController = require('./controllers/tradingController');
const integratedController = require('./controllers/integratedController');
const notificationService = require('./services/notificationService');
const serverConfig = require('./config/server');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, serverConfig.websocket);

// Middleware
app.use(express.json());
app.use(express.static('public'));

// PWA-specific headers
app.use((req, res, next) => {
    // Service Worker
    if (req.path === '/sw.js') {
        res.setHeader('Service-Worker-Allowed', '/');
        res.setHeader('Content-Type', 'application/javascript');
    }
    
    // Cache control for different file types
    if (req.path.match(/\.(jpg|jpeg|png|gif|ico|svg)$/i)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    } else if (req.path.match(/\.(css|js)$/i)) {
        res.setHeader('Cache-Control', 'public, max-age=86400');
    } else if (req.path === '/manifest.json') {
        res.setHeader('Cache-Control', 'public, max-age=3600');
        res.setHeader('Content-Type', 'application/manifest+json');
    }
    
    // Security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    next();
});

// Compress responses for better mobile performance
const compression = require('compression');
app.use(compression());

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log('Cliente conectado:', socket.id);
    
    const clientId = socket.id;
    notificationService.subscribe(clientId, socket);

    // Manejar actualización de preferencias
    socket.on('update_preferences', (preferences) => {
        notificationService.updatePreferences(clientId, preferences);
    });

    // Manejar solicitudes de análisis (legacy)
    socket.on('request_analysis', async (data) => {
        try {
            const { pair, timeframe } = data;
            const decisionService = require('./services/decisionService');
            const decision = await decisionService.makeDecision(pair, timeframe);
            socket.emit('analysis_result', decision);
        } catch (error) {
            socket.emit('analysis_error', { error: error.message });
        }
    });

    // Manejar inicio de sistema integrado
    socket.on('start_integrated_system', async (config) => {
        try {
            const integratedDecisionService = require('./services/integratedDecisionService');
            const result = await integratedDecisionService.startIntegratedAnalysis(config);
            socket.emit('integrated_system_started', result);
        } catch (error) {
            socket.emit('integrated_system_error', { error: error.message });
        }
    });

    // Manejar detención de sistema integrado
    socket.on('stop_integrated_system', async () => {
        try {
            const integratedDecisionService = require('./services/integratedDecisionService');
            const result = await integratedDecisionService.stopIntegratedAnalysis();
            socket.emit('integrated_system_stopped', result);
        } catch (error) {
            socket.emit('integrated_system_error', { error: error.message });
        }
    });

    // Manejar entrada visual (imagen de cámara/pantalla)
    socket.on('visual_input', async (imageData) => {
        try {
            const integratedDecisionService = require('./services/integratedDecisionService');
            const result = await integratedDecisionService.processVisualInput(imageData);
            socket.emit('visual_analysis_result', result);
        } catch (error) {
            socket.emit('visual_analysis_error', { error: error.message });
        }
    });

    // Manejar solicitud de estado del sistema
    socket.on('get_system_status', async () => {
        try {
            const integratedDecisionService = require('./services/integratedDecisionService');
            const status = integratedDecisionService.getStatus();
            socket.emit('system_status', status);
        } catch (error) {
            socket.emit('system_status_error', { error: error.message });
        }
    });

    socket.on('disconnect', () => {
        console.log('Cliente desconectado:', socket.id);
        notificationService.unsubscribe(clientId);
    });
});

// API Routes
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: Date.now() });
});

// Análisis de pares específicos
app.get('/api/analyze/:pair', tradingController.analyzePair.bind(tradingController));
app.get('/api/analyze/:pair/:timeframe', tradingController.analyzePair.bind(tradingController));

// Análisis multi-timeframe
app.get('/api/multi-timeframe/:pair', tradingController.analyzeMultiTimeframe.bind(tradingController));

// Análisis de todos los pares
app.get('/api/analyze-all', tradingController.analyzeAllPairs.bind(tradingController));

// Datos actuales
app.get('/api/data/:pair', tradingController.getCurrentData.bind(tradingController));
app.get('/api/data', tradingController.getCurrentData.bind(tradingController));

// Notificaciones
app.post('/api/notifications/config', tradingController.configureNotifications.bind(tradingController));
app.get('/api/notifications/history', tradingController.getNotificationHistory.bind(tradingController));
app.get('/api/notifications/stats', tradingController.getStatistics.bind(tradingController));

// Suscripciones
app.post('/api/subscribe', tradingController.subscribeToUpdates.bind(tradingController));

// Análisis continuo
app.post('/api/continuous/start', tradingController.startContinuousAnalysis.bind(tradingController));
app.post('/api/continuous/stop', tradingController.stopContinuousAnalysis.bind(tradingController));

// Sistema Integrado - Proveedores
app.get('/api/integrated/providers', integratedController.getAvailableProviders.bind(integratedController));
app.post('/api/integrated/providers/configure', integratedController.configureProvider.bind(integratedController));
app.get('/api/integrated/providers/:providerId/test', integratedController.testProvider.bind(integratedController));

// Sistema Integrado - Timeframes
app.get('/api/integrated/timeframes', integratedController.getAvailableTimeframes.bind(integratedController));

// Sistema Integrado - Control
app.post('/api/integrated/start', integratedController.startIntegratedSystem.bind(integratedController));
app.post('/api/integrated/stop', integratedController.stopIntegratedSystem.bind(integratedController));
app.get('/api/integrated/status', integratedController.getSystemStatus.bind(integratedController));

// Sistema Integrado - Historial
app.get('/api/integrated/history', integratedController.getAnalysisHistory.bind(integratedController));
app.get('/api/integrated/sessions', integratedController.getSessionHistory.bind(integratedController));
app.get('/api/integrated/sessions/:sessionId/analyses', integratedController.getSessionAnalyses.bind(integratedController));
app.get('/api/integrated/statistics', integratedController.getStatistics.bind(integratedController));
app.post('/api/integrated/export', integratedController.exportHistory.bind(integratedController));

// Sistema Integrado - Visual
app.post('/api/integrated/visual', integratedController.processVisualInput.bind(integratedController));

// Sistema Integrado - Configuración
app.post('/api/integrated/weights', integratedController.updateWeights.bind(integratedController));

// Tarea programada para análisis automático de pares principales
cron.schedule('*/5 * * * *', async () => {
    try {
        console.log('Ejecutando análisis programado de pares principales...');
        const apiConfig = require('./config/apiKeys');
        
        for (const pair of apiConfig.majorPairs) {
            try {
                const decisionService = require('./services/decisionService');
                const decision = await decisionService.makeDecision(pair, '1h');
                
                if (decision.actionable) {
                    await notificationService.notifyAll(decision);
                }
            } catch (error) {
                console.error(`Error en análisis programado de ${pair}:`, error.message);
            }
        }
    } catch (error) {
        console.error('Error en tarea programada:', error.message);
    }
});

// Iniciar servidor
const PORT = serverConfig.port;
server.listen(PORT, serverConfig.host, () => {
    console.log(`🚀 Servidor de Trading Forex corriendo en http://${serverConfig.host}:${PORT}`);
    console.log(`📊 Análisis en tiempo real activado`);
    console.log(`🔔 Sistema de notificaciones activado`);
    console.log(`⏰ Análisis programado cada 5 minutos`);
});

// Manejo de errores
process.on('uncaughtException', (error) => {
    console.error('Error no capturado:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Promesa rechazada no manejada:', reason);
});

module.exports = { app, server, io };