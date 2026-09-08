const axios = require('axios');
const BaseDataProvider = require('./BaseDataProvider');

/**
 * Proveedor FreeForex API (Gratuito)
 * Datos en tiempo real limitados
 */
class FreeForexProvider extends BaseDataProvider {
    constructor(config = {}) {
        super({
            name: 'FreeForex API',
            type: 'free',
            dataQuality: 'medium',
            realTime: true, // Tiempo real aproximado
            supportedPairs: [
                'EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF',
                'AUD/USD', 'USD/CAD', 'NZD/USD', 'EUR/GBP',
                'EUR/JPY', 'GBP/JPY'
            ],
            supportedTimeframes: ['1m', '5m', '15m', '30m', '1h', '1d'],
            canTrade: false,
            rateLimits: {
                requestsPerMinute: 100,
                requestsPerDay: 10000
            },
            ...config
        });
        
        this.baseUrl = 'https://www.freeforexapi.com/api/live';
    }

    async getCurrentData(pair) {
        try {
            const formattedPair = pair.replace('/', '');
            const response = await axios.get(`${this.baseUrl}?pair=${formattedPair}`);
            
            if (!response.data.rates || !response.data.rates[formattedPair]) {
                throw new Error(`Par ${pair} no disponible`);
            }

            const rateData = response.data.rates[formattedPair];
            
            return this.normalizeData({
                pair,
                rate: rateData.rate,
                timestamp: rateData.timestamp || Date.now(),
                source: this.name
            });
        } catch (error) {
            console.error(`Error en ${this.name}:`, error.message);
            throw error;
        }
    }

    async getHistoricalData(pair, timeframe, limit = 100) {
        // FreeForex API tiene limitaciones en datos históricos
        console.warn(`${this.name} tiene limitaciones en datos históricos`);
        
        return this.generateSimulatedHistoricalData(pair, timeframe, limit);
    }

    generateSimulatedHistoricalData(pair, timeframe, count) {
        const data = [];
        let basePrice = this.getBasePriceForPair(pair);
        
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
            'GBPJPY': 184.50
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

module.exports = FreeForexProvider;