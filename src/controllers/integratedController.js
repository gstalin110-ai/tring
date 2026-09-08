const integratedDecisionService = require('../services/integratedDecisionService');
const dataProviderService = require('../services/dataProviderService');
const historyManager = require('../utils/historyManager');
const timeframesConfig = require('../config/timeframes');

/**
 * Controlador para el sistema integrado de análisis
 */
class IntegratedController {
    /**
     * Obtener proveedores disponibles
     */
    async getAvailableProviders(req, res) {
        try {
            const providers = dataProviderService.getAvailableProviders();
            
            res.json({
                success: true,
                data: providers
            });

        } catch (error) {
            console.error('Error obteniendo proveedores:', error.message);
            res.status(500).json({ 
                success: false, 
                error: error.message 
            });
        }
    }

    /**
     * Configurar proveedor
     */
    async configureProvider(req, res) {
        try {
            const { providerId, config } = req.body;
            
            if (!providerId) {
                return res.status(400).json({ error: 'Se requiere providerId' });
            }

            const provider = dataProviderService.configureProvider(providerId, config);
            
            res.json({
                success: true,
                data: provider.getProviderInfo()
            });

        } catch (error) {
            console.error('Error configurando proveedor:', error.message);
            res.status(500).json({ 
                success: false, 
                error: error.message 
            });
        }
    }

    /**
     * Probar conexión de proveedor
     */
    async testProvider(req, res) {
        try {
            const { providerId } = req.params;
            
            const connected = await dataProviderService.testProviderConnection(providerId);
            
            res.json({
                success: true,
                connected,
                providerId
            });

        } catch (error) {
            console.error('Error probando proveedor:', error.message);
            res.status(500).json({ 
                success: false, 
                error: error.message 
            });
        }
    }

    /**
     * Obtener timeframes disponibles
     */
    async getAvailableTimeframes(req, res) {
        try {
            const timeframes = timeframesConfig.available;
            
            res.json({
                success: true,
                data: timeframes
            });

        } catch (error) {
            console.error('Error obteniendo timeframes:', error.message);
            res.status(500).json({ 
                success: false, 
                error: error.message 
            });
        }
    }

    /**
     * Iniciar sistema integrado
     */
    async startIntegratedSystem(req, res) {
        try {
            const config = req.body;

            // Validar configuración
            if (!config.pairs || !Array.isArray(config.pairs) || config.pairs.length === 0) {
                return res.status(400).json({ error: 'Se requiere al menos un par de divisas' });
            }

            if (!config.timeframes || !Array.isArray(config.timeframes) || config.timeframes.length === 0) {
                return res.status(400).json({ error: 'Se requiere al menos un timeframe' });
            }

            if (!config.notificationInterval || config.notificationInterval < 5) {
                return res.status(400).json({ error: 'El intervalo de notificación debe ser al menos 5 segundos' });
            }

            if (!config.apiProvider) {
                return res.status(400).json({ error: 'Se requiere seleccionar un proveedor de API' });
            }

            // Valores por defecto
            config.visualMode = config.visualMode || 'none';
            config.notificationSound = config.notificationSound !== false;

            // Iniciar sistema
            const result = await integratedDecisionService.startIntegratedAnalysis(config);
            
            res.json({
                success: true,
                data: result
            });

        } catch (error) {
            console.error('Error iniciando sistema integrado:', error.message);
            res.status(500).json({ 
                success: false, 
                error: error.message 
            });
        }
    }

    /**
     * Detener sistema integrado
     */
    async stopIntegratedSystem(req, res) {
        try {
            const result = await integratedDecisionService.stopIntegratedAnalysis();
            
            res.json({
                success: true,
                data: result
            });

        } catch (error) {
            console.error('Error deteniendo sistema integrado:', error.message);
            res.status(500).json({ 
                success: false, 
                error: error.message 
            });
        }
    }

    /**
     * Obtener estado del sistema
     */
    async getSystemStatus(req, res) {
        try {
            const status = integratedDecisionService.getStatus();
            
            res.json({
                success: true,
                data: status
            });

        } catch (error) {
            console.error('Error obteniendo estado del sistema:', error.message);
            res.status(500).json({ 
                success: false, 
                error: error.message 
            });
        }
    }

    /**
     * Obtener historial de análisis
     */
    async getAnalysisHistory(req, res) {
        try {
            const { limit, pair, signal, startDate, endDate } = req.query;
            
            const filters = {};
            if (pair) filters.pair = pair;
            if (signal) filters.signal = signal;
            if (startDate) filters.startDate = parseInt(startDate);
            if (endDate) filters.endDate = parseInt(endDate);

            const history = await historyManager.getAnalysisHistory(
                parseInt(limit) || 50,
                filters
            );
            
            res.json({
                success: true,
                data: history,
                count: history.length
            });

        } catch (error) {
            console.error('Error obteniendo historial:', error.message);
            res.status(500).json({ 
                success: false, 
                error: error.message 
            });
        }
    }

    /**
     * Obtener historial de sesiones
     */
    async getSessionHistory(req, res) {
        try {
            const { limit } = req.query;
            
            const sessions = await historyManager.getSessionHistory(parseInt(limit) || 20);
            
            res.json({
                success: true,
                data: sessions,
                count: sessions.length
            });

        } catch (error) {
            console.error('Error obteniendo historial de sesiones:', error.message);
            res.status(500).json({ 
                success: false, 
                error: error.message 
            });
        }
    }

    /**
     * Obtener estadísticas
     */
    async getStatistics(req, res) {
        try {
            const stats = await historyManager.getStatistics();
            
            res.json({
                success: true,
                data: stats
            });

        } catch (error) {
            console.error('Error obteniendo estadísticas:', error.message);
            res.status(500).json({ 
                success: false, 
                error: error.message 
            });
        }
    }

    /**
     * Exportar historial a CSV
     */
    async exportHistory(req, res) {
        try {
            const { outputPath } = req.body;
            
            const defaultPath = require('path').join(process.cwd(), 'data', 'export.csv');
            const exportPath = outputPath || defaultPath;

            const result = await historyManager.exportToCSV(exportPath);
            
            res.json({
                success: true,
                data: { outputPath: result }
            });

        } catch (error) {
            console.error('Error exportando historial:', error.message);
            res.status(500).json({ 
                success: false, 
                error: error.message 
            });
        }
    }

    /**
     * Procesar entrada visual (imagen de cámara/pantalla)
     */
    async processVisualInput(req, res) {
        try {
            // En una implementación real, aquí recibiríamos la imagen
            // Por ahora es un placeholder
            
            res.json({
                success: true,
                message: 'Endpoint para procesamiento visual - requiere implementación de carga de imágenes'
            });

        } catch (error) {
            console.error('Error procesando entrada visual:', error.message);
            res.status(500).json({ 
                success: false, 
                error: error.message 
            });
        }
    }

    /**
     * Obtener análisis de sesión específica
     */
    async getSessionAnalyses(req, res) {
        try {
            const { sessionId } = req.params;
            
            const analyses = await historyManager.getSessionAnalyses(sessionId);
            
            res.json({
                success: true,
                data: analyses,
                count: analyses.length
            });

        } catch (error) {
            console.error('Error obteniendo análisis de sesión:', error.message);
            res.status(500).json({ 
                success: false, 
                error: error.message 
            });
        }
    }

    /**
     * Actualizar pesos de análisis
     */
    async updateWeights(req, res) {
        try {
            const { weights } = req.body;
            
            integratedDecisionService.updateWeights(weights);
            
            res.json({
                success: true,
                data: { weights: integratedDecisionService.weights }
            });

        } catch (error) {
            console.error('Error actualizando pesos:', error.message);
            res.status(500).json({ 
                success: false, 
                error: error.message 
            });
        }
    }
}

module.exports = new IntegratedController();