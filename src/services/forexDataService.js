const axios = require('axios');
const apiConfig = require('../config/apiKeys');

class ForexDataService {
    constructor() {
        this.cache = new Map();
        this.cacheTimeout = 30000; // 30 segundos
    }

    // Obtener datos de múltiples APIs para redundancia
    async getForexData(pair = 'EUR/USD') {
        try {
            const formattedPair = pair.replace('/', '');
            
            // Intentar con múltiples APIs
            const results = await Promise.allSettled([
                this.getFromExchangeRateAPI(pair),
                this.getFromFreeForexAPI(formattedPair),
                this.getFromFrankfurterAPI(formattedPair)
            ]);

            // Usar el primer resultado exitoso
            for (const result of results) {
                if (result.status === 'fulfilled' && result.value) {
                    return result.value;
                }
            }

            throw new Error('Todas las APIs fallaron');
        } catch (error) {
            console.error('Error obteniendo datos forex:', error.message);
            throw error;
        }
    }

    async getFromExchangeRateAPI(pair) {
        try {
            const base = pair.split('/')[0];
            const response = await axios.get(`${apiConfig.exchangerate.baseUrl}${base}`);
            
            return {
                pair: pair,
                rate: response.data.rates[pair.split('/')[1]],
                timestamp: Date.now(),
                source: 'exchangerate-api'
            };
        } catch (error) {
            console.error('Error ExchangeRate API:', error.message);
            return null;
        }
    }

    async getFromFreeForexAPI(pair) {
        try {
            const response = await axios.get(`${apiConfig.forexApi.baseUrl}?pair=${pair}`);
            
            return {
                pair: pair,
                rate: response.data.rates?.[pair],
                timestamp: Date.now(),
                source: 'freeforex-api'
            };
        } catch (error) {
            console.error('Error FreeForex API:', error.message);
            return null;
        }
    }

    async getFromFrankfurterAPI(pair) {
        try {
            const base = pair.substring(0, 3);
            const target = pair.substring(3, 6);
            const response = await axios.get(`${apiConfig.alternativeApi.baseUrl}/latest?from=${base}&to=${target}`);
            
            return {
                pair: pair,
                rate: response.data.rates[target],
                timestamp: Date.now(),
                source: 'frankfurter-api'
            };
        } catch (error) {
            console.error('Error Frankfurter API:', error.message);
            return null;
        }
    }

    // Obtener datos históricos para análisis técnico
    async getHistoricalData(pair, timeframe = '1h', limit = 100) {
        // Implementación básica - en producción usar API específica
        try {
            const cacheKey = `${pair}_${timeframe}_${limit}`;
            
            if (this.cache.has(cacheKey)) {
                const cached = this.cache.get(cacheKey);
                if (Date.now() - cached.timestamp < this.cacheTimeout) {
                    return cached.data;
                }
            }

            // Generar datos simulados para demostración
            const data = this.generateHistoricalData(pair, limit);
            
            this.cache.set(cacheKey, {
                data: data,
                timestamp: Date.now()
            });

            return data;
        } catch (error) {
            console.error('Error obteniendo datos históricos:', error.message);
            throw error;
        }
    }

    generateHistoricalData(pair, count) {
        const data = [];
        let basePrice = this.getBasePriceForPair(pair);
        
        for (let i = 0; i < count; i++) {
            const change = (Math.random() - 0.5) * 0.002;
            basePrice = basePrice * (1 + change);
            
            const open = basePrice;
            const close = basePrice * (1 + (Math.random() - 0.5) * 0.001);
            const high = Math.max(open, close) * (1 + Math.random() * 0.0005);
            const low = Math.min(open, close) * (1 - Math.random() * 0.0005);
            
            data.push({
                timestamp: Date.now() - (count - i) * 60000,
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
            'NZDUSD': 0.6000
        };
        return prices[pair.replace('/', '')] || 1.0;
    }

    // Obtener todos los pares principales
    async getAllMajorPairs() {
        const promises = apiConfig.majorPairs.map(pair => 
            this.getForexData(pair).catch(() => null)
        );
        
        const results = await Promise.all(promises);
        return results.filter(result => result !== null);
    }
}

module.exports = new ForexDataService();