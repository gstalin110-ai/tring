const axios = require('axios');
const BaseDataProvider = require('./BaseDataProvider');

/**
 * Proveedor Frankfurter API (Gratuito)
 * Datos de tipo cambio del Banco Central Europeo
 */
class FrankfurterProvider extends BaseDataProvider {
    constructor(config = {}) {
        super({
            name: 'Frankfurter API',
            type: 'free',
            dataQuality: 'high',
            realTime: false, // Datos del Banco Central, actualizados diariamente
            supportedPairs: [
                'EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF',
                'AUD/USD', 'USD/CAD', 'NZD/USD', 'EUR/GBP',
                'EUR/JPY', 'GBP/JPY', 'EUR/CHF', 'GBP/CHF',
                'USD/SGD', 'USD/HKD', 'USD/ZAR'
            ],
            supportedTimeframes: ['1d', '1w'],
            canTrade: false,
            rateLimits: {
                requestsPerMinute: 10,
                requestsPerDay: 1000
            },
            ...config
        });
        
        this.baseUrl = 'https://api.frankfurter.app';
    }

    async getCurrentData(pair) {
        try {
            const base = pair.substring(0, 3);
            const target = pair.substring(3, 6);
            
            const response = await axios.get(`${this.baseUrl}/latest?from=${base}&to=${target}`);
            
            if (!response.data.rates[target]) {
                throw new Error(`Par ${pair} no disponible`);
            }

            return this.normalizeData({
                pair,
                rate: response.data.rates[target],
                timestamp: new Date(response.data.date).getTime(),
                source: this.name
            });
        } catch (error) {
            console.error(`Error en ${this.name}:`, error.message);
            throw error;
        }
    }

    async getHistoricalData(pair, timeframe, limit = 100) {
        try {
            const base = pair.substring(0, 3);
            const target = pair.substring(3, 6);
            
            // Calcular fecha de inicio
            const endDate = new Date();
            const startDate = new Date();
            
            const daysBack = this.getDaysForTimeframe(timeframe, limit);
            startDate.setDate(startDate.getDate() - daysBack);
            
            const response = await axios.get(
                `${this.baseUrl}/${startDate.toISOString().split('T')[0]}..${endDate.toISOString().split('T')[0]}?from=${base}&to=${target}`
            );
            
            const historicalData = [];
            const rates = response.data.rates;
            
            Object.keys(rates).sort().forEach(date => {
                historicalData.push({
                    timestamp: new Date(date).getTime(),
                    open: rates[date][target],
                    high: rates[date][target] * 1.001, // Simulación
                    low: rates[date][target] * 0.999,  // Simulación
                    close: rates[date][target],
                    volume: Math.random() * 1000
                });
            });
            
            return historicalData.slice(-limit);
        } catch (error) {
            console.error(`Error en datos históricos ${this.name}:`, error.message);
            // Fallback a datos simulados
            return this.generateSimulatedHistoricalData(pair, timeframe, limit);
        }
    }

    getDaysForTimeframe(timeframe, limit) {
        const daysMap = {
            '1d': 1,
            '1w': 7,
            '1h': 1,
            '15m': 1,
            '5m': 1,
            '1m': 1
        };
        return Math.max(daysMap[timeframe] || 30, limit * this.getDaysMultiplier(timeframe));
    }

    getDaysMultiplier(timeframe) {
        const multipliers = {
            '1d': 1,
            '1w': 7,
            '1h': 1/24,
            '15m': 1/96,
            '5m': 1/288,
            '1m': 1/1440
        };
        return multipliers[timeframe] || 1;
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

module.exports = FrankfurterProvider;