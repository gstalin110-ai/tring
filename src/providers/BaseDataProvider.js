/**
 * Interfaz base para todos los proveedores de datos forex
 * Todos los proveedores deben implementar estos métodos
 */
class BaseDataProvider {
    constructor(config) {
        this.config = config;
        this.name = config.name || 'Unknown Provider';
        this.type = config.type || 'free'; // free, demo, paid
        this.enabled = config.enabled !== false;
        this.apiKey = config.apiKey || null;
        this.rateLimits = config.rateLimits || {};
        this.dataQuality = config.dataQuality || 'medium'; // low, medium, high
        this.realTime = config.realTime || false;
        this.supportedPairs = config.supportedPairs || [];
        this.supportedTimeframes = config.supportedTimeframes || [];
        this.canTrade = config.canTrade || false;
    }

    /**
     * Obtener datos actuales de un par específico
     * @param {string} pair - Par de divisas (ej: 'EUR/USD')
     * @returns {Promise<Object>} Datos actuales del par
     */
    async getCurrentData(pair) {
        throw new Error('getCurrentData debe ser implementado por el proveedor');
    }

    /**
     * Obtener datos históricos
     * @param {string} pair - Par de divisas
     * @param {string} timeframe - Timeframe (5s, 30s, 1m, 5m, 15m, 30m, 1h, 1d, 1w)
     * @param {number} limit - Cantidad de velas
     * @returns {Promise<Array>} Datos históricos
     */
    async getHistoricalData(pair, timeframe, limit = 100) {
        throw new Error('getHistoricalData debe ser implementado por el proveedor');
    }

    /**
     * Obtener múltiples pares simultáneamente
     * @param {Array<string>} pairs - Array de pares
     * @returns {Promise<Array>} Datos de todos los pares
     */
    async getMultiplePairs(pairs) {
        const promises = pairs.map(pair => 
            this.getCurrentData(pair).catch(error => ({
                pair,
                error: error.message,
                success: false
            }))
        );
        
        const results = await Promise.all(promises);
        return results.filter(result => result.success !== false);
    }

    /**
     * Verificar si el proveedor soporta un timeframe específico
     * @param {string} timeframe - Timeframe a verificar
     * @returns {boolean}
     */
    supportsTimeframe(timeframe) {
        return this.supportedTimeframes.includes(timeframe);
    }

    /**
     * Verificar si el proveedor soporta un par específico
     * @param {string} pair - Par a verificar
     * @returns {boolean}
     */
    supportsPair(pair) {
        return this.supportedPairs.length === 0 || this.supportedPairs.includes(pair);
    }

    /**
     * Obtener información del proveedor
     * @returns {Object} Información del proveedor
     */
    getProviderInfo() {
        return {
            name: this.name,
            type: this.type,
            enabled: this.enabled,
            dataQuality: this.dataQuality,
            realTime: this.realTime,
            supportedPairs: this.supportedPairs,
            supportedTimeframes: this.supportedTimeframes,
            canTrade: this.canTrade,
            rateLimits: this.rateLimits
        };
    }

    /**
     * Verificar conexión con el proveedor
     * @returns {Promise<boolean>}
     */
    async testConnection() {
        try {
            await this.getCurrentData('EUR/USD');
            return true;
        } catch (error) {
            console.error(`Error conectando con ${this.name}:`, error.message);
            return false;
        }
    }

    /**
     * Normalizar formato de datos al estándar interno
     * @param {Object} rawData - Datos crudos del proveedor
     * @returns {Object} Datos normalizados
     */
    normalizeData(rawData) {
        throw new Error('normalizeData debe ser implementado por el proveedor');
    }
}

module.exports = BaseDataProvider;