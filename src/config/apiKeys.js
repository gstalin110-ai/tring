// Configuración de APIs de datos forex gratuitas
module.exports = {
    // Exchangerate API (gratuita, limitada)
    exchangerate: {
        baseUrl: 'https://api.exchangerate-api.com/v4/latest/',
        enabled: true
    },
    
    // Forex API (gratis con registro)
    forexApi: {
        baseUrl: 'https://www.freeforexapi.com/api/live',
        enabled: true
    },
    
    // Alternative API (gratis)
    alternativeApi: {
        baseUrl: 'https://api.frankfurter.app',
        enabled: true
    },
    
    // Pares de divisas principales
    majorPairs: [
        'EUR/USD',
        'GBP/USD', 
        'USD/JPY',
        'USD/CHF',
        'AUD/USD',
        'USD/CAD',
        'NZD/USD'
    ],
    
    // Timeframes para análisis
    timeframes: {
        SCALPING: '1m',
        SHORT_TERM: '5m',
        MEDIUM_TERM: '15m',
        LONG_TERM: '1h'
    }
};