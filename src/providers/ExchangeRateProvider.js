const axios = require('axios');
const BaseDataProvider = require('./BaseDataProvider');

/**
 * Proveedor ExchangeRate API (Gratuito)
 * Datos de tipo cambio, limitado en tiempo real
 */
class ExchangeRateProvider extends BaseDataProvider {
    constructor(config = {}) {
        super({
            name: 'ExchangeRate API',
            type: 'free',
            dataQuality: 'medium',
            realTime: false, // Tiene cierto retraso
            supportedPairs: [
                'EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF',
                'AUD/USD', 'USD/CAD', 'NZD/USD', 'EUR/GBP',
                'EUR/JPY', 'GBP/JPY', 'EUR/CHF', 'GBP/CHF'
            ],
            supportedTimeframes: ['1h', '1d', '1w'],
            canTrade: false,
            rateLimits: {
                requestsPerMinute: 10,
                requestsPerDay: 1000
            },
            ...config
        });
        
        this.baseUrl = 'https://api.exchangerate-api.com/v4/latest/';
    }

    async getCurrentData(pair) {
        try {
            const base = pair.split('/')[0];
            const target = pair.split('/')[1];
            
            const response = await axios.get(`${this.baseUrl}${base}`);
            
            if (!response.data.rates[target]) {
                throw new Error(`Par ${pair} no disponible`);
            }

            return this.normalizeData({
                pair,
                rate: response.data.rates[target],
                timestamp: Date.now(),
                source: this.name
            });
        } catch (error) {
            console.error(`Error en ${this.name}:`, error.message);
            throw error;
        }
    }

    async getHistoricalData(pair, timeframe, limit = 100) {
        // ExchangeRate API no tiene datos históricos gratuitos
        // Generamos datos simulados para este ejemplo
        console.warn(`${this.name} no soporta datos históricos, generando simulación`);
        
        return this.generateSimulatedHistoricalData(pair, timeframe, limit);
    }

    generateSimulatedHistoricalData(pair, timeframe, count) {
        const data = [];
        let basePrice = this.getBasePriceForPair(pair);
        
        // Ajustar intervalo según timeframe
        const intervalMs = this.getTimeframeInterval(timeframe);
        
        for (let i = 0; i < count; i++) {
            const change = (Math.random() - 0.5) * 0.002;
            basePrice = basePrice * (1 + change);
            
            const open = basePrice;
            const close = basePrice * (1 + (Math.random() - 0.5) * 0.001);
            const high = Math.max(open, close) * (1 + Math.random() * 0.0005);
            const low = Math.min(open, close) * (1 - Math.random() * 0.0005);
            
            data.push({
                timestamp: Date.now() - (count - i) * intervalMs,
                open: open,
                high: high,
                low: low,
                close: close,
                volume: Math.random() * 1000
            });
        }
        
        return data;
    }

    getBasePriceForPair(pair) {
        const prices = {
            'EURUSD': 1.0850,
            'GBPUSD': 1.2700,
            'USDJPY': 145.50,
            'USDCHF': 0.8900,
            'AUDUSD': 0.6500,
            'USDCAD': 1.3500,
            'NZDUSD': 0.6000,
            'EURGBP': 0.8600,
            'EURJPY': 158.00,
            'GBPJPY': 184.50,
            'EURCHF': 0.9650,
            'GBPCHF': 1.1300
        };
        return prices[pair.replace('/', '')] || 1.0;
    }

    getTimeframeInterval(timeframe) {
        const intervals = {
            '5s': 5000,
            '30s': 30000,
            '1m': 60000,
            '5m': 300000,
            '15m': 900000,
            '30m': 1800000,
            '1h': 3600000,
            '1d': 86400000,
            '1w': 604800000
        };
        return intervals[timeframe] || 3600000;
    }

    normalizeData(rawData) {
        return {
            pair: rawData.pair,
            price: rawData.rate,
            timestamp: rawData.timestamp,
            source: rawData.source,
            provider: this.name,
            quality: this.dataQuality,
            realTime: this.realTime
        };
    }
}

module.exports = ExchangeRateProvider;