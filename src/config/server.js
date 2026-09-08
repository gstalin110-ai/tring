// Configuración del servidor
module.exports = {
    port: process.env.PORT || 3000,
    host: process.env.HOST || 'localhost',
    
    // Configuración de WebSocket
    websocket: {
        cors: {
            origin: '*',
            methods: ['GET', 'POST']
        }
    },
    
    // Configuración de análisis
    analysis: {
        intervals: [5, 10, 20, 30, 60], // segundos para notificaciones
        defaultInterval: 30,
        enableAllAnalysis: true, // técnico, noticias, algoritmos
        confidenceThreshold: 0.6 // nivel de confianza mínimo
    },
    
    // Configuración de notificaciones
    notifications: {
        enabled: true,
        sound: true,
        visual: true,
        log: true
    }
};