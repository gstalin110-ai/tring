const decisionService = require('../services/decisionService');
const notificationService = require('../services/notificationService');
const forexDataService = require('../services/forexDataService');

class TradingController {
    // Análisis simple de un par
    async analyzePair(req, res) {
        try {
            const { pair, timeframe } = req.params;
            
            if (!pair) {
                return res.status(400).json({ error: 'Se requiere especificar el par de divisas' });
            }

            const decision = await decisionService.makeDecision(pair, timeframe || '1h');
            
            res.json({
                success: true,
                data: decision
            });

        } catch (error) {
            console.error('Error en analyzePair:', error.message);
            res.status(500).json({ 
                success: false, 
                error: error.message 
            });
        }
    }

    // Análisis multi-timeframe
    async analyzeMultiTimeframe(req, res) {
        try {
            const { pair } = req.params;
            
            if (!pair) {
                return res.status(400).json({ error: 'Se requiere especificar el par de divisas' });
            }

            const analysis = await decisionService.performMultiTimeframeAnalysis(pair);
            
            res.json({
                success: true,
                data: analysis
            });

        } catch (error) {
            console.error('Error en analyzeMultiTimeframe:', error.message);
            res.status(500).json({ 
                success: false, 
                error: error.message 
            });
        }
    }

    // Análisis de todos los pares principales
    async analyzeAllPairs(req, res) {
        try {
            const apiConfig = require('../config/apiKeys');
            const pairs = apiConfig.majorPairs;
            
            const analyses = await Promise.all(
                pairs.map(async pair => {
                    try {
                        return await decisionService.makeDecision(pair, '1h');
                    } catch (error) {
                        console.error(`Error analizando ${pair}:`, error.message);
                        return null;
                    }
                })
            );

            const validAnalyses = analyses.filter(a => a !== null);
            
            res.json({
                success: true,
                data: validAnalyses,
                count: validAnalyses.length
            });

        } catch (error) {
            console.error('Error en analyzeAllPairs:', error.message);
            res.status(500).json({ 
                success: false, 
                error: error.message 
            });
        }
    }

    // Obtener datos actuales de forex
    async getCurrentData(req, res) {
        try {
            const { pair } = req.params;
            
            let data;
            if (pair) {
                data = await forexDataService.getForexData(pair);
            } else {
                data = await forexDataService.getAllMajorPairs();
            }
            
            res.json({
                success: true,
                data
            });

        } catch (error) {
            console.error('Error en getCurrentData:', error.message);
            res.status(500).json({ 
                success: false, 
                error: error.message 
            });
        }
    }

    // Configurar notificaciones
    async configureNotifications(req, res) {
        try {
            const { intervals, active, sound, visual } = req.body;
            
            if (intervals) {
                notificationService.setIntervals(intervals);
            }
            
            if (typeof active === 'boolean') {
                notificationService.setActive(active);
            }
            
            if (typeof sound === 'boolean') {
                notificationService.config.sound = sound;
            }
            
            if (typeof visual === 'boolean') {
                notificationService.config.visual = visual;
            }
            
            res.json({
                success: true,
                config: notificationService.config
            });

        } catch (error) {
            console.error('Error en configureNotifications:', error.message);
            res.status(500).json({ 
                success: false, 
                error: error.message 
            });
        }
    }

    // Obtener historial de notificaciones
    async getNotificationHistory(req, res) {
        try {
            const { limit } = req.query;
            const history = notificationService.getHistory(parseInt(limit) || 20);
            
            res.json({
                success: true,
                data: history
            });

        } catch (error) {
            console.error('Error en getNotificationHistory:', error.message);
            res.status(500).json({ 
                success: false, 
                error: error.message 
            });
        }
    }

    // Obtener estadísticas
    async getStatistics(req, res) {
        try {
            const stats = notificationService.getStatistics();
            
            res.json({
                success: true,
                data: stats
            });

        } catch (error) {
            console.error('Error en getStatistics:', error.message);
            res.status(500).json({ 
                success: false, 
                error: error.message 
            });
        }
    }

    // Suscribir a actualizaciones en tiempo real
    async subscribeToUpdates(req, res) {
        try {
            const { pairs, intervals } = req.body;
            const clientId = req.headers['client-id'] || `client_${Date.now()}`;
            
            // En una implementación real con WebSocket, esto se manejaría de forma diferente
            // Aquí es un placeholder para la API REST
            
            res.json({
                success: true,
                message: 'Suscripción configurada',
                clientId,
                config: { pairs, intervals }
            });

        } catch (error) {
            console.error('Error en subscribeToUpdates:', error.message);
            res.status(500).json({ 
                success: false, 
                error: error.message 
            });
        }
    }

    // Iniciar análisis continuo
    async startContinuousAnalysis(req, res) {
        try {
            const { pairs, interval } = req.body;
            
            if (!pairs || !Array.isArray(pairs)) {
                return res.status(400).json({ error: 'Se requiere array de pares' });
            }

            const intervalSeconds = interval || 30;
            
            // Iniciar análisis continuo para cada par
            const analysisPromises = pairs.map(pair => 
                this.startPairAnalysis(pair, intervalSeconds)
            );

            await Promise.all(analysisPromises);
            
            res.json({
                success: true,
                message: `Análisis continuo iniciado para ${pairs.length} pares cada ${intervalSeconds}s`,
                pairs,
                interval: intervalSeconds
            });

        } catch (error) {
            console.error('Error en startContinuousAnalysis:', error.message);
            res.status(500).json({ 
                success: false, 
                error: error.message 
            });
        }
    }

    async startPairAnalysis(pair, interval) {
        const intervalId = await notificationService.scheduleAlert(
            pair, 
            interval, 
            async (pair) => {
                try {
                    const decision = await decisionService.makeDecision(pair, '1h');
                    await notificationService.notifyAll(decision);
                    console.log(`Análisis completado para ${pair} - Acción: ${decision.decision.action}`);
                } catch (error) {
                    console.error(`Error en análisis continuo de ${pair}:`, error.message);
                }
            }
        );

        // Guardar el intervalId para poder detenerlo después
        if (!this.activeIntervals) {
            this.activeIntervals = new Map();
        }
        this.activeIntervals.set(pair, intervalId);
    }

    // Detener análisis continuo
    async stopContinuousAnalysis(req, res) {
        try {
            const { pairs } = req.body;
            
            if (!pairs || !Array.isArray(pairs)) {
                return res.status(400).json({ error: 'Se requiere array de pares' });
            }

            pairs.forEach(pair => {
                const intervalId = this.activeIntervals?.get(pair);
                if (intervalId) {
                    notificationService.cancelAlert(intervalId);
                    this.activeIntervals.delete(pair);
                }
            });
            
            res.json({
                success: true,
                message: `Análisis continuo detenido para ${pairs.length} pares`,
                pairs
            });

        } catch (error) {
            console.error('Error en stopContinuousAnalysis:', error.message);
            res.status(500).json({ 
                success: false, 
                error: error.message 
            });
        }
    }
}

module.exports = new TradingController();