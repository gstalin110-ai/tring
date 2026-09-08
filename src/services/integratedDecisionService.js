const multiTimeframeAnalysisService = require('./multiTimeframeAnalysisService');
const newsAnalysisService = require('./newsAnalysisService');
const algorithmicAnalysisService = require('./algorithmicAnalysisService');
const visualAnalysisService = require('./visualAnalysisService');
const historyManager = require('../utils/historyManager');
const dataProviderService = require('./dataProviderService');

/**
 * Servicio de decisión integrado
 * Combina todos los análisis: API, multitemporal, noticias, algorítmico y visual
 */
class IntegratedDecisionService {
    constructor() {
        this.weights = {
            multiTimeframe: 0.35,  // 35% análisis multitemporal
            news: 0.15,             // 15% noticias
            algorithmic: 0.25,      // 25% análisis algorítmico
            visual: 0.25            // 25% análisis visual
        };
        this.isRunning = false;
        this.analysisInterval = null;
        this.currentConfig = null;
    }

    /**
     * Iniciar sistema integrado de análisis
     */
    async startIntegratedAnalysis(config) {
        try {
            if (this.isRunning) {
                throw new Error('El sistema ya está corriendo');
            }

            console.log('Iniciando sistema de análisis integrado...');

            // Inicializar historial
            await historyManager.initialize();

            // Iniciar sesión
            await historyManager.startSession(config);

            // Configurar proveedor de datos
            if (config.apiProvider) {
                dataProviderService.setActiveProvider(config.apiProvider);
            }

            // Guardar configuración
            this.currentConfig = config;
            this.isRunning = true;

            // Ejecutar primer análisis inmediatamente
            await this.performIntegratedAnalysis();

            // Configurar análisis periódico
            const notificationIntervalMs = config.notificationInterval * 1000;
            this.analysisInterval = setInterval(async () => {
                try {
                    await this.performIntegratedAnalysis();
                } catch (error) {
                    console.error('Error en análisis periódico:', error.message);
                }
            }, notificationIntervalMs);

            console.log(`Sistema iniciado - Análisis cada ${config.notificationInterval}s`);
            console.log(`Timeframes: ${config.timeframes.join(', ')}`);
            console.log(`Pares: ${config.pairs.join(', ')}`);

            return {
                success: true,
                message: 'Sistema iniciado correctamente',
                config
            };

        } catch (error) {
            console.error('Error iniciando sistema integrado:', error.message);
            throw error;
        }
    }

    /**
     * Detener sistema integrado de análisis
     */
    async stopIntegratedAnalysis() {
        try {
            if (!this.isRunning) {
                throw new Error('El sistema no está corriendo');
            }

            console.log('Deteniendo sistema de análisis integrado...');

            // Detener intervalo
            if (this.analysisInterval) {
                clearInterval(this.analysisInterval);
                this.analysisInterval = null;
            }

            // Finalizar sesión
            const session = await historyManager.endSession();

            this.isRunning = false;
            this.currentConfig = null;

            console.log(`Sistema detenido - Sesión: ${session.id}`);
            console.log(`Duración: ${Math.round(session.duration / 1000)}s`);
            console.log(`Análisis realizados: ${session.analyses.length}`);

            return {
                success: true,
                message: 'Sistema detenido correctamente',
                session
            };

        } catch (error) {
            console.error('Error deteniendo sistema integrado:', error.message);
            throw error;
        }
    }

    /**
     * Realizar análisis integrado completo
     */
    async performIntegratedAnalysis() {
        try {
            console.log('Realizando análisis integrado...');

            const config = this.currentConfig;
            const results = {};

            // 1. Análisis multitemporal (fuente principal)
            console.log('1. Análisis multitemporal...');
            for (const pair of config.pairs) {
                try {
                    const multiTimeframeAnalysis = await multiTimeframeAnalysisService.performMultiTimeframeAnalysis(
                        pair,
                        config.timeframes
                    );
                    results[pair] = {
                        multiTimeframe: multiTimeframeAnalysis,
                        timestamp: Date.now()
                    };
                } catch (error) {
                    console.error(`Error en análisis multitemporal de ${pair}:`, error.message);
                    results[pair] = {
                        multiTimeframe: null,
                        error: error.message
                    };
                }
            }

            // 2. Análisis de noticias
            console.log('2. Análisis de noticias...');
            try {
                const news = await newsAnalysisService.getForexNews();
                const newsSentiment = newsAnalysisService.getMarketSentiment(news);
                results.news = {
                    news,
                    sentiment: newsSentiment
                };
            } catch (error) {
                console.error('Error en análisis de noticias:', error.message);
                results.news = { error: error.message };
            }

            // 3. Análisis algorítmico (se integra dentro del multitemporal)
            console.log('3. Análisis algorítmico integrado...');

            // 4. Análisis visual (si está activo)
            if (config.visualMode && config.visualMode !== 'none') {
                console.log('4. Análisis visual...');
                try {
                    // Aquí se procesaría la imagen de cámara/pantalla
                    // Por ahora simulamos que se recibirá por WebSocket
                    results.visual = {
                        status: 'waiting_input',
                        mode: config.visualMode
                    };
                } catch (error) {
                    console.error('Error en análisis visual:', error.message);
                    results.visual = { error: error.message };
                }
            }

            // 5. Integrar todos los análisis y generar decisiones
            console.log('5. Integrando análisis y generando decisiones...');
            const integratedDecisions = {};
            
            for (const pair of config.pairs) {
                if (results[pair] && results[pair].multiTimeframe) {
                    integratedDecisions[pair] = this.generateIntegratedDecision(
                        pair,
                        results[pair],
                        results.news,
                        results.visual
                    );

                    // Guardar en historial
                    await historyManager.addAnalysis(integratedDecisions[pair]);
                }
            }

            return {
                success: true,
                timestamp: Date.now(),
                results,
                decisions: integratedDecisions,
                config
            };

        } catch (error) {
            console.error('Error en análisis integrado:', error.message);
            throw error;
        }
    }

    /**
     * Generar decisión integrada para un par
     */
    generateIntegratedDecision(pair, pairResults, newsResults, visualResults) {
        const multiTimeframe = pairResults.multiTimeframe;
        const integratedAnalysis = multiTimeframe.integratedAnalysis;

        // Convertir análisis a scores numéricos
        const multiTimeframeScore = this.convertMultiTimeframeToScore(integratedAnalysis);
        const newsScore = this.convertNewsToScore(newsResults?.sentiment);
        const visualScore = this.convertVisualToScore(visualResults);

        // Calcular score ponderado
        const weightedScore = 
            (multiTimeframeScore * this.weights.multiTimeframe) +
            (newsScore * this.weights.news) +
            (visualScore * this.weights.visual);

        // Generar decisión final
        const decision = this.generateFinalDecision(weightedScore, integratedAnalysis);

        return {
            id: `decision_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            pair,
            timestamp: Date.now(),
            decision,
            analysis: {
                multiTimeframe: multiTimeframeAnalysisService.getExecutiveSummary(multiTimeframe),
                news: newsResults?.sentiment,
                visual: visualResults
            },
            confidence: decision.confidence,
            actionable: decision.confidence > 0.6,
            dataSource: 'integrated',
            currentPrice: this.getCurrentPrice(multiTimeframe),
            timeframesAnalyzed: multiTimeframe.availableTimeframes,
            providers: {
                api: dataProviderService.getActiveProviderInfo()?.name || 'unknown',
                visual: visualResults?.mode || 'none'
            }
        };
    }

    /**
     * Convertir análisis multitemporal a score numérico
     */
    convertMultiTimeframeToScore(integratedAnalysis) {
        const { overallTrend, trendStrength, consensus } = integratedAnalysis;

        if (overallTrend === 'bullish') {
            return trendStrength * consensus.bullish;
        } else if (overallTrend === 'bearish') {
            return -trendStrength * consensus.bearish;
        }
        return 0;
    }

    /**
     * Convertir análisis de noticias a score numérico
     */
    convertNewsToScore(newsSentiment) {
        if (!newsSentiment) return 0;

        if (newsSentiment.sentiment === 'bullish') {
            return newsSentiment.confidence;
        } else if (newsSentiment.sentiment === 'bearish') {
            return -newsSentiment.confidence;
        }
        return 0;
    }

    /**
     * Convertir análisis visual a score numérico
     */
    convertVisualToScore(visualResults) {
        if (!visualResults || visualResults.status === 'waiting_input') {
            return 0; // Neutral si no hay datos visuales
        }

        if (visualResults.visualAnalysis) {
            const sentiment = visualResults.visualAnalysis.overallSentiment;
            if (sentiment.sentiment === 'bullish') {
                return sentiment.confidence * visualResults.confidence;
            } else if (sentiment.sentiment === 'bearish') {
                return -sentiment.confidence * visualResults.confidence;
            }
        }
        return 0;
    }

    /**
     * Generar decisión final
     */
    generateFinalDecision(weightedScore, integratedAnalysis) {
        let action = 'hold';
        let confidence = 0;
        let reasons = [];

        if (weightedScore > 0.3) {
            action = 'buy';
            confidence = weightedScore;
            reasons.push('Análisis integrado positivo');
        } else if (weightedScore < -0.3) {
            action = 'sell';
            confidence = Math.abs(weightedScore);
            reasons.push('Análisis integrado negativo');
        } else {
            action = 'hold';
            confidence = 1 - Math.abs(weightedScore);
            reasons.push('Señales mixtas, mantener posición');
        }

        // Añadir razones específicas del análisis multitemporal
        if (integratedAnalysis.overallTrend === 'bullish') {
            reasons.push('Tendencia general alcista');
        } else if (integratedAnalysis.overallTrend === 'bearish') {
            reasons.push('Tendencia general bajista');
        }

        // Nivel de riesgo
        const riskLevel = this.calculateRiskLevel(weightedScore, integratedAnalysis);

        return {
            action,
            confidence: Math.min(confidence, 1),
            reasons,
            riskLevel,
            timeframe: this.suggestTimeframe(integratedAnalysis)
        };
    }

    /**
     * Calcular nivel de riesgo
     */
    calculateRiskLevel(weightedScore, integratedAnalysis) {
        const strength = integratedAnalysis.trendStrength;

        if (Math.abs(weightedScore) > 0.7 || strength > 0.8) {
            return 'high';
        } else if (Math.abs(weightedScore) > 0.4 || strength > 0.5) {
            return 'medium';
        } else {
            return 'low';
        }
    }

    /**
     * Sugerir timeframe basado en análisis
     */
    suggestTimeframe(integratedAnalysis) {
        const { immediate, current, intermediate } = integratedAnalysis.timeframeHierarchy;

        if (immediate.strength > 0.7) {
            return 'scalping'; // 5s - 1m
        } else if (current.strength > 0.7) {
            return 'short_term'; // 1m - 15m
        } else if (intermediate.strength > 0.7) {
            return 'medium_term'; // 15m - 1h
        } else {
            return 'long_term'; // 1h+
        }
    }

    /**
     * Obtener precio actual del análisis
     */
    getCurrentPrice(multiTimeframe) {
        // Intentar obtener del timeframe más corto disponible
        const immediateTimeframes = ['5s', '30s', '1m'];
        
        for (const tf of immediateTimeframes) {
            const tfAnalysis = multiTimeframe.timeframeAnalyses[tf];
            if (tfAnalysis && tfAnalysis.available && tfAnalysis.currentPrice) {
                return tfAnalysis.currentPrice;
            }
        }

        // Fallback al primer timeframe disponible
        const firstAvailable = Object.values(multiTimeframe.timeframeAnalyses).find(
            tf => tf.available && tf.currentPrice
        );

        return firstAvailable?.currentPrice || 0;
    }

    /**
     * Procesar entrada visual (llamado desde WebSocket)
     */
    async processVisualInput(imageBuffer, options = {}) {
        try {
            if (!this.isRunning) {
                throw new Error('El sistema no está corriendo');
            }

            const visualAnalysis = await visualAnalysisService.processVisualInput(imageBuffer, options);

            // Si el análisis visual es concluyente, podríamos forzar un reanálisis
            if (visualAnalysis.confidence > 0.7) {
                console.log('Análisis visual concluyente, reevaluando decisiones...');
                // Aquí podríamos llamar a performIntegratedAnalysis nuevamente
            }

            return visualAnalysis;

        } catch (error) {
            console.error('Error procesando entrada visual:', error.message);
            throw error;
        }
    }

    /**
     * Obtener estado actual del sistema
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            currentConfig: this.currentConfig,
            hasActiveSession: historyManager.hasActiveSession(),
            currentSession: historyManager.getCurrentSession()
        };
    }

    /**
     * Actualizar pesos de análisis
     */
    updateWeights(newWeights) {
        this.weights = { ...this.weights, ...newWeights };
        console.log('Pesos actualizados:', this.weights);
    }
}

module.exports = new IntegratedDecisionService();