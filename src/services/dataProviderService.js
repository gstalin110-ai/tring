const ExchangeRateProvider = require('../providers/ExchangeRateProvider');
const FreeForexProvider = require('../providers/FreeForexProvider');
const FrankfurterProvider = require('../providers/FrankfurterProvider');
const DemoBrokerProvider = require('../providers/DemoBrokerProvider');

/**
 * Servicio de gestión de proveedores de datos
 * Permite cambiar entre diferentes APIs de forma modular
 */
class DataProviderService {
    constructor() {
        this.providers = new Map();
        this.activeProvider = null;
        this.fallbackProviders = [];
        
        // Inicializar proveedores disponibles
        this.initializeProviders();
    }

    /**
     * Inicializar todos los proveedores disponibles
     */
    initializeProviders() {
        // Proveedores gratuitos
        this.registerProvider('exchangerate', new ExchangeRateProvider());
        this.registerProvider('freeforex', new FreeForexProvider());
        this.registerProvider('frankfurter', new FrankfurterProvider());
        
        // Proveedor demo (template para APIs de pago)
        this.registerProvider('demobroker', new DemoBrokerProvider({
            enabled: false, // Deshabilitado por defecto
            accessToken: null // Requiere configuración
        }));
    }

    /**
     * Registrar un nuevo proveedor
     */
    registerProvider(id, provider) {
        this.providers.set(id, provider);
        console.log(`Proveedor registrado: ${provider.name} (${id})`);
    }

    /**
     * Obtener lista de proveedores disponibles
     */
    getAvailableProviders() {
        const providers = [];
        
        for (const [id, provider] of this.providers) {
            providers.push({
                id,
                ...provider.getProviderInfo()
            });
        }
        
        return providers;
    }

    /**
     * Establecer proveedor activo
     */
    setActiveProvider(providerId) {
        const provider = this.providers.get(providerId);
        
        if (!provider) {
            throw new Error(`Proveedor ${providerId} no encontrado`);
        }
        
        if (!provider.enabled) {
            throw new Error(`Proveedor ${providerId} no está habilitado`);
        }
        
        this.activeProvider = provider;
        console.log(`Proveedor activo cambiado a: ${provider.name}`);
        
        return provider;
    }

    /**
     * Configurar proveedor específico
     */
    configureProvider(providerId, config) {
        const provider = this.providers.get(providerId);
        
        if (!provider) {
            throw new Error(`Proveedor ${providerId} no encontrado`);
        }
        
        // Actualizar configuración del proveedor
        Object.assign(provider.config, config);
        
        if (config.enabled !== undefined) {
            provider.enabled = config.enabled;
        }
        
        if (config.apiKey) {
            provider.apiKey = config.apiKey;
        }
        
        console.log(`Proveedor ${providerId} configurado:`, config);
        
        return provider;
    }

    /**
     * Obtener datos actuales del proveedor activo
     */
    async getCurrentData(pair) {
        if (!this.activeProvider) {
            throw new Error('No hay proveedor activo seleccionado');
        }
        
        try {
            return await this.activeProvider.getCurrentData(pair);
        } catch (error) {
            console.error(`Error con proveedor activo, intentando fallback:`, error.message);
            return await this.tryFallback(pair, 'getCurrentData');
        }
    }

    /**
     * Obtener datos históricos del proveedor activo
     */
    async getHistoricalData(pair, timeframe, limit = 100) {
        if (!this.activeProvider) {
            throw new Error('No hay proveedor activo seleccionado');
        }
        
        // Verificar si el proveedor soporta el timeframe
        if (!this.activeProvider.supportsTimeframe(timeframe)) {
            console.warn(`Proveedor activo no soporta timeframe ${timeframe}`);
        }
        
        try {
            return await this.activeProvider.getHistoricalData(pair, timeframe, limit);
        } catch (error) {
            console.error(`Error con proveedor activo, intentando fallback:`, error.message);
            return await this.tryFallback(pair, 'getHistoricalData', timeframe, limit);
        }
    }

    /**
     * Intentar obtener datos de proveedores de fallback
     */
    async tryFallback(pair, method, ...args) {
        for (const providerId of this.fallbackProviders) {
            const provider = this.providers.get(providerId);
            
            if (provider && provider.enabled) {
                try {
                    console.log(`Intentando fallback con ${provider.name}`);
                    return await provider[method](pair, ...args);
                } catch (error) {
                    console.error(`Fallback con ${provider.name} falló:`, error.message);
                }
            }
        }
        
        throw new Error('Todos los proveedores fallaron');
    }

    /**
     * Configurar proveedores de fallback
     */
    setFallbackProviders(providerIds) {
        this.fallbackProviders = providerIds.filter(id => this.providers.has(id));
        console.log('Proveedores de fallback configurados:', this.fallbackProviders);
    }

    /**
     * Obtener datos de múltiples pares
     */
    async getMultiplePairs(pairs) {
        if (!this.activeProvider) {
            throw new Error('No hay proveedor activo seleccionado');
        }
        
        return await this.activeProvider.getMultiplePairs(pairs);
    }

    /**
     * Verificar conexión del proveedor activo
     */
    async testConnection() {
        if (!this.activeProvider) {
            throw new Error('No hay proveedor activo seleccionado');
        }
        
        return await this.activeProvider.testConnection();
    }

    /**
     * Verificar conexión de un proveedor específico
     */
    async testProviderConnection(providerId) {
        const provider = this.providers.get(providerId);
        
        if (!provider) {
            throw new Error(`Proveedor ${providerId} no encontrado`);
        }
        
        return await provider.testConnection();
    }

    /**
     * Obtener información del proveedor activo
     */
    getActiveProviderInfo() {
        if (!this.activeProvider) {
            return null;
        }
        
        return this.activeProvider.getProviderInfo();
    }

    /**
     * Obtener mejor proveedor para un requisito específico
     */
    getBestProviderFor(requirements) {
        const { timeframes, realTime, canTrade, quality } = requirements;
        
        let bestProvider = null;
        let bestScore = -1;
        
        for (const [id, provider] of this.providers) {
            if (!provider.enabled) continue;
            
            let score = 0;
            
            // Verificar timeframes requeridos
            if (timeframes) {
                const supportedTimeframes = timeframes.filter(tf => 
                    provider.supportsTimeframe(tf)
                );
                score += (supportedTimeframes.length / timeframes.length) * 30;
            }
            
            // Verificar tiempo real
            if (realTime && provider.realTime) {
                score += 20;
            }
            
            // Verificar capacidad de trading
            if (canTrade && provider.canTrade) {
                score += 20;
            }
            
            // Verificar calidad de datos
            if (quality) {
                const qualityScores = { low: 10, medium: 20, high: 30 };
                score += qualityScores[provider.dataQuality] || 0;
            }
            
            if (score > bestScore) {
                bestScore = score;
                bestProvider = provider;
            }
        }
        
        return bestProvider;
    }

    /**
     * Habilitar/deshabilitar proveedor
     */
    toggleProvider(providerId, enabled) {
        const provider = this.providers.get(providerId);
        
        if (!provider) {
            throw new Error(`Proveedor ${providerId} no encontrado`);
        }
        
        provider.enabled = enabled;
        console.log(`Proveedor ${provider.name} ${enabled ? 'habilitado' : 'deshabilitado'}`);
        
        return provider;
    }
}

module.exports = new DataProviderService();