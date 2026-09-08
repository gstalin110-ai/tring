/**
 * Configuración de timeframes soportados
 * Incluye todos los timeframes solicitados por el usuario
 */
module.exports = {
    // Timeframes disponibles
    available: [
        {
            id: '5s',
            name: '5 segundos',
            category: 'scalping',
            interval: 5000,
            description: 'Movimiento ultra-corto plazo'
        },
        {
            id: '30s',
            name: '30 segundos',
            category: 'scalping',
            interval: 30000,
            description: 'Scalping de alta frecuencia'
        },
        {
            id: '1m',
            name: '1 minuto',
            category: 'short_term',
            interval: 60000,
            description: 'Corto plazo'
        },
        {
            id: '5m',
            name: '5 minutos',
            category: 'short_term',
            interval: 300000,
            description: 'Corto plazo extendido'
        },
        {
            id: '15m',
            name: '15 minutos',
            category: 'medium_term',
            interval: 900000,
            description: 'Medio plazo'
        },
        {
            id: '30m',
            name: '30 minutos',
            category: 'medium_term',
            interval: 1800000,
            description: 'Medio plazo extendido'
        },
        {
            id: '1h',
            name: '1 hora',
            category: 'long_term',
            interval: 3600000,
            description: 'Largo plazo'
        },
        {
            id: '1d',
            name: '1 día',
            category: 'swing',
            interval: 86400000,
            description: 'Swing trading'
        },
        {
            id: '1w',
            name: '1 semana',
            category: 'position',
            interval: 604800000,
            description: 'Position trading'
        }
    ],

    // Timeframes recomendados por categoría
    byCategory: {
        scalping: ['5s', '30s', '1m'],
        short_term: ['1m', '5m', '15m'],
        medium_term: ['15m', '30m', '1h'],
        long_term: ['1h', '4h', '1d'],
        swing: ['1d', '1w'],
        position: ['1w', '1M']
    },

    // Timeframes para análisis multitemporal jerárquico
    multiTimeframeHierarchy: {
        // Tendencia general
        general: ['1w', '1d'],
        // Tendencia diaria
        daily: ['1d', '4h', '1h'],
        // Tendencia intermedia
        intermediate: ['1h', '30m', '15m'],
        // Situación actual
        current: ['15m', '5m', '1m'],
        // Movimiento inmediato
        immediate: ['1m', '30s', '5s']
    },

    // Obtener información de un timeframe específico
    getTimeframeInfo(timeframeId) {
        return this.available.find(tf => tf.id === timeframeId);
    },

    // Obtener intervalo en milisegundos
    getIntervalMs(timeframeId) {
        const tf = this.getTimeframeInfo(timeframeId);
        return tf ? tf.interval : 60000; // Default 1 minuto
    },

    // Verificar si un timeframe es válido
    isValidTimeframe(timeframeId) {
        return this.available.some(tf => tf.id === timeframeId);
    },

    // Obtener timeframes por categoría
    getByCategory(category) {
        return this.available.filter(tf => tf.category === category);
    }
};