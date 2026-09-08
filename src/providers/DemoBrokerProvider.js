const BaseDataProvider = require('./BaseDataProvider');

/**
 * Proveedor Demo para Broker (Ejemplo de arquitectura para APIs de pago)
 * Este es un template para implementar brokers reales como OANDA, FXCM, etc.
 */
class DemoBrokerProvider extends BaseDataProvider {
    constructor(config = {}) {
        super({
            name: 'Demo Broker API',
            type: 'demo',
            dataQuality: 'high',
            realTime: true,
            supportedPairs: [
                'EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF',
                'AUD/USD', 'USD/CAD', 'NZD/USD', 'EUR/GBP',
                'EUR/JPY', 'GBP/JPY', 'EUR/CHF', 'GBP/CHF',
                'USD/SGD', 'USD/HKD', 'USD/ZAR', 'USD/MXN'
            ],
            supportedTimeframes: ['5s', '30s', '1m', '5m', '15m', '30m', '1h', '1d', '1w'],
            canTrade: true, // Permite operar
            rateLimits: {
                requestsPerMinute: 1000,
                requestsPerDay: 100000
            },
            ...config
        });
        
        this.apiUrl = config.apiUrl || 'https://api.demo-broker.com/v1';
        this.accountId = config.accountId || null;
        this.accessToken = config.accessToken || null;
    }

    async getCurrentData(pair) {
        if (!this.accessToken) {
            throw new Error('Se requiere access token para el proveedor Demo Broker');
        }

        try {
            // Simulación de llamada a API real
            // En producción: const response = await axios.get(`${this.apiUrl}/prices?instruments=${pair}`, { headers: { Authorization: `Bearer ${this.accessToken}` } });
            
            const mockData = this.generateMockCurrentData(pair);
            
            return this.normalizeData({
                pair,
                ...mockData,
                timestamp: Date.now(),
                source: this.name
            });
        } catch (error) {
            console.error(`Error en ${this.name}:`, error.message);
            throw error;
        }
    }

    async getHistoricalData(pair, timeframe, limit = 100) {
        if (!this.accessToken) {
            throw new Error('Se requiere access token para el proveedor Demo Broker');
        }

        try {
            // Simulación de llamada a API real
            // En producción: const response = await axios.get(`${this.apiUrl}/candles?instrument=${pair}&granularity=${timeframe}&count=${limit}`, { headers: { Authorization: `Bearer ${this.accessToken}` } });
            
            return this.generateMockHistoricalData(pair, timeframe, limit);
        } catch (error) {
            console.error(`Error en datos históricos ${this.name}:`, error.message);
            throw error;
        }
    }

    generateMockCurrentData(pair) {
        const basePrice = this.getBasePriceForPair(pair);
        const spread = 0.0002; // 2 pips
        
        return {
            bid: basePrice - spread / 2,
            ask: basePrice + spread / 2,
            mid: basePrice,
            spread: spread
        };
    }

    generateMockHistoricalData(pair, timeframe, count) {
        const data = [];
        let basePrice = this.getBasePriceForPair(pair);
        
        const intervalMs = this.getTimeframeInterval(timeframe);
        
        for (let i = 0; i < count; i++) {
            const change = (Math.random() - 0.5) * 0.001;
            basePrice = basePrice * (1 + change);
            
            const open = basePrice;
            const close = basePrice * (1 + (Math.random() - 0.5) * 0.0005);
            const high = Math.max(open, close) * (1 + Math.random() * 0.0003);
            const low = Math.min(open, close) * (1 - Math.random() * 0.0003);
            
            data.push({
                timestamp: Date.now() - (count - i) * intervalMs,
                open: open,
                high: high,
                low: low,
                close: close,
                volume: Math.random() * 5000
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
            'GBPCHF': 1.1300,
            'USDSGD': 1.3400,
            'USDHKD': 7.8200,
            'USDZAR': 18.50,
            'USDMXN': 17.20
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

    /**
     * Ejecutar orden de trading (solo para proveedores que canTrade = true)
     */
    async executeOrder(orderParams) {
        if (!this.canTrade) {
            throw new Error('Este proveedor no permite ejecutar órdenes');
        }

        if (!this.accessToken) {
            throw new Error('Se requiere access token para ejecutar órdenes');
        }

        // Simulación de ejecución de orden
        // En producción: llamada real a la API del broker
        
        return {
            orderId: `order_${Date.now()}`,
            status: 'filled',
            instrument: orderParams.instrument,
            units: orderParams.units,
            side: orderParams.side,
            price: orderParams.price,
            timestamp: Date.now()
        };
    }

    /**
     * Obtener saldo de cuenta
     */
    async getAccountBalance() {
        if (!this.accessToken) {
            throw new Error('Se requiere access token para obtener saldo');
        }

        // Simulación
        return {
            balance: 10000,
            unrealizedPL: 150,
            marginUsed: 500,
            marginAvailable: 9500
        };
    }

    normalizeData(rawData) {
        return {
            pair: rawData.pair,
            price: rawData.mid || rawData.rate,
            bid: rawData.bid,
            ask: rawData.ask,
            spread: rawData.spread,
            timestamp: rawData.timestamp,
            source: rawData.source,
            provider: this.name,
            quality: this.dataQuality,
            realTime: this.realTime
        };
    }
}

module.exports = DemoBrokerProvider;