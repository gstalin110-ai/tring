const technicalAnalysisService = require('./technicalAnalysisService');
const timeframesConfig = require('../config/timeframes');
const dataProviderService = require('./dataProviderService');

/**
 * Servicio de análisis multitemporal
 * Analiza múltiples timeframes simultáneamente para determinar tendencias
 */
class MultiTimeframeAnalysisService {
    constructor() {
        this.analysisCache = new Map();
        this.cacheTimeout = 60000; // 1 minuto
    }

    /**
     * Realizar análisis multitemporal completo
     * @param {string} pair - Par de divisas
     * @param {Array<string>} timeframes - Array de timeframes a analizar
     * @returns {Promise<Object>} Análisis multitemporal
     */
    async performMultiTimeframeAnalysis(pair, timeframes) {
        try {
            console.log(`Iniciando análisis multitemporal para ${pair} con timeframes:`, timeframes);
            
            // Validar timeframes
            const validTimeframes = timeframes.filter(tf => 
                timeframesConfig.isValidTimeframe(tf)
            );
            
            if (validTimeframes.length === 0) {
                throw new Error('No hay timeframes válidos para analizar');
            }

            // Analizar cada timeframe
            const timeframeAnalyses = {};
            const analysisPromises = validTimeframes.map(async (timeframe) => {
                try {
                    const analysis = await this.analyzeTimeframe(pair, timeframe);
                    return { timeframe, analysis };
                } catch (error) {
                    console.error(`Error analizando timeframe ${timeframe}:`, error.message);
                    return { timeframe, analysis: null, error: error.message };
                }
            });

            const results = await Promise.all(analysisPromises);

            // Organizar resultados
            results.forEach(({ timeframe, analysis, error }) => {
                if (analysis) {
                    timeframeAnalyses[timeframe] = analysis;
                } else {
                    timeframeAnalyses[timeframe] = { error, available: false };
                }
            });

            // Integrar análisis de todos los timeframes
            const integratedAnalysis = this.integrateTimeframeAnalyses(timeframeAnalyses);

            return {
                pair,
                timestamp: Date.now(),
                timeframes: validTimeframes,
                timeframeAnalyses,
                integratedAnalysis,
                availableTimeframes: Object.keys(timeframeAnalyses).filter(
                    tf => timeframeAnalyses[tf].available !== false
                )
            };

        } catch (error) {
            console.error('Error en análisis multitemporal:', error.message);
            throw error;
        }
    }

    /**
     * Analizar un timeframe específico
     */
    async analyzeTimeframe(pair, timeframe) {
        try {
            // Verificar disponibilidad del timeframe en el proveedor activo
            const activeProvider = dataProviderService.getActiveProviderInfo();
            if (activeProvider && !activeProvider.supportedTimeframes.includes(timeframe)) {
                console.warn(`Timeframe ${timeframe} no soportado por el proveedor actual`);
                return {
                    available: false,
                    reason: 'Timeframe no soportado por el proveedor actual',
                    provider: activeProvider.name
                };
            }

            // Obtener datos históricos para este timeframe
            const historicalData = await dataProviderService.getHistoricalData(
                pair, 
                timeframe, 
                100 // cantidad de velas
            );

            if (!historicalData || historicalData.length === 0) {
                return {
                    available: false,
                    reason: 'No se pudieron obtener datos históricos'
                };
            }

            // Realizar análisis técnico
            const technicalAnalysis = technicalAnalysisService.performFullAnalysis(historicalData);

            // Obtener información del timeframe
            const timeframeInfo = timeframesConfig.getTimeframeInfo(timeframe);

            return {
                available: true,
                timeframe,
                timeframeInfo,
                technicalAnalysis,
                currentPrice: historicalData[historicalData.length - 1].close,
                dataPoints: historicalData.length,
                provider: activeProvider?.name || 'unknown'
            };

        } catch (error) {
            console.error(`Error en análisis de timeframe ${timeframe}:`, error.message);
            return {
                available: false,
                error: error.message
            };
        }
    }

    /**
     * Integrar análisis de múltiples timeframes
     */
    integrateTimeframeAnalyses(timeframeAnalyses) {
        const integration = {
            overallTrend: 'neutral',
            trendStrength: 0,
            timeframeHierarchy: {
                general: { trend: 'neutral', strength: 0 },
                daily: { trend: 'neutral', strength: 0 },
                intermediate: { trend: 'neutral', strength: 0 },
                current: { trend: 'neutral', strength: 0 },
                immediate: { trend: 'neutral', strength: 0 }
            },
            consensus: {
                bullish: 0,
                bearish: 0,
                neutral: 0
            },
            recommendation: 'hold',
            confidence: 0
        };

        // Analizar por jerarquía de timeframes
        const hierarchy = timeframesConfig.multiTimeframeHierarchy;

        // Tendencia general (1w, 1d)
        integration.timeframeHierarchy.general = this.analyzeHierarchyLevel(
            timeframeAnalyses, hierarchy.general
        );

        // Tendencia diaria (1d, 4h, 1h)
        integration.timeframeHierarchy.daily = this.analyzeHierarchyLevel(
            timeframeAnalyses, hierarchy.daily
        );

        // Tendencia intermedia (1h, 30m, 15m)
        integration.timeframeHierarchy.intermediate = this.analyzeHierarchyLevel(
            timeframeAnalyses, hierarchy.intermediate
        );

        // Situación actual (15m, 5m, 1m)
        integration.timeframeHierarchy.current = this.analyzeHierarchyLevel(
            timeframeAnalyses, hierarchy.current
        );

        // Movimiento inmediato (1m, 30s, 5s)
        integration.timeframeHierarchy.immediate = this.analyzeHierarchyLevel(
            timeframeAnalyses, hierarchy.immediate
        );

        // Calcular consenso general
        Object.values(integration.timeframeHierarchy).forEach(level => {
            if (level.trend === 'bullish') integration.consensus.bullish += level.strength;
            else if (level.trend === 'bearish') integration.consensus.bearish += level.strength;
            else integration.consensus.neutral += level.strength;
        });

        // Determinar tendencia general y recomendación
        const total = integration.consensus.bullish + integration.consensus.bearish + integration.consensus.neutral;
        
        if (total > 0) {
            const bullishRatio = integration.consensus.bullish / total;
            const bearishRatio = integration.consensus.bearish / total;

            if (bullishRatio > 0.6) {
                integration.overallTrend = 'bullish';
                integration.recommendation = 'buy';
                integration.confidence = bullishRatio;
            } else if (bearishRatio > 0.6) {
                integration.overallTrend = 'bearish';
                integration.recommendation = 'sell';
                integration.confidence = bearishRatio;
            } else {
                integration.overallTrend = 'neutral';
                integration.recommendation = 'hold';
                integration.confidence = 0.5;
            }

            integration.trendStrength = Math.max(
                integration.consensus.bullish, 
                integration.consensus.bearish
            ) / total;
        }

        return integration;
    }

    /**
     * Analizar un nivel específico de la jerarquía
     */
    analyzeHierarchyLevel(timeframeAnalyses, timeframeIds) {
        const levelAnalysis = {
            trend: 'neutral',
            strength: 0,
            availableTimeframes: [],
            details: {}
        };

        let bullishScore = 0;
        let bearishScore = 0;
        let availableCount = 0;

        timeframeIds.forEach(tfId => {
            const analysis = timeframeAnalyses[tfId];
            
            if (analysis && analysis.available && analysis.technicalAnalysis) {
                availableCount++;
                levelAnalysis.availableTimeframes.push(tfId);
                
                const trend = analysis.technicalAnalysis.trend;
                const candlestick = analysis.technicalAnalysis.candlestick.overallSentiment;

                // Ponderar según dirección de tendencia
                if (trend.direction === 'bullish') {
                    bullishScore += trend.strength;
                } else if (trend.direction === 'bearish') {
                    bearishScore += trend.strength;
                }

                // Añadir sentimiento de velas
                if (candlestick) {
                    if (candlestick.sentiment === 'bullish') {
                        bullishScore += candlestick.confidence * 0.5;
                    } else if (candlestick.sentiment === 'bearish') {
                        bearishScore += candlestick.confidence * 0.5;
                    }
                }

                levelAnalysis.details[tfId] = {
                    trend: trend.direction,
                    strength: trend.strength,
                    sentiment: candlestick?.sentiment,
                    currentPrice: analysis.currentPrice
                };
            }
        });

        if (availableCount > 0) {
            const total = bullishScore + bearishScore;
            
            if (total > 0) {
                const bullishRatio = bullishScore / total;
                
                if (bullishRatio > 0.6) {
                    levelAnalysis.trend = 'bullish';
                    levelAnalysis.strength = bullishRatio;
                } else if (bullishRatio < 0.4) {
                    levelAnalysis.trend = 'bearish';
                    levelAnalysis.strength = 1 - bullishRatio;
                } else {
                    levelAnalysis.trend = 'neutral';
                    levelAnalysis.strength = 0.5;
                }
            }
        }

        return levelAnalysis;
    }

    /**
     * Obtener resumen ejecutivo del análisis multitemporal
     */
    getExecutiveSummary(multiTimeframeAnalysis) {
        const { integratedAnalysis, timeframeAnalyses } = multiTimeframeAnalysis;

        return {
            pair: multiTimeframeAnalysis.pair,
            timestamp: multiTimeframeAnalysis.timestamp,
            overallTrend: integratedAnalysis.overallTrend,
            recommendation: integratedAnalysis.recommendation,
            confidence: (integratedAnalysis.confidence * 100).toFixed(1) + '%',
            trendHierarchy: {
                general: `${integratedAnalysis.timeframeHierarchy.general.trend.toUpperCase()} (${(integratedAnalysis.timeframeHierarchy.general.strength * 100).toFixed(0)}%)`,
                daily: `${integratedAnalysis.timeframeHierarchy.daily.trend.toUpperCase()} (${(integratedAnalysis.timeframeHierarchy.daily.strength * 100).toFixed(0)}%)`,
                intermediate: `${integratedAnalysis.timeframeHierarchy.intermediate.trend.toUpperCase()} (${(integratedAnalysis.timeframeHierarchy.intermediate.strength * 100).toFixed(0)}%)`,
                current: `${integratedAnalysis.timeframeHierarchy.current.trend.toUpperCase()} (${(integratedAnalysis.timeframeHierarchy.current.strength * 100).toFixed(0)}%)`,
                immediate: `${integratedAnalysis.timeframeHierarchy.immediate.trend.toUpperCase()} (${(integratedAnalysis.timeframeHierarchy.immediate.strength * 100).toFixed(0)}%)`
            },
            availableTimeframes: multiTimeframeAnalysis.availableTimeframes,
            consensus: {
                bullish: (integratedAnalysis.consensus.bullish * 100).toFixed(1) + '%',
                bearish: (integratedAnalysis.consensus.bearish * 100).toFixed(1) + '%',
                neutral: (integratedAnalysis.consensus.neutral * 100).toFixed(1) + '%'
            }
        };
    }

    /**
     * Obtener análisis detallado de un timeframe específico
     */
    getTimeframeDetail(multiTimeframeAnalysis, timeframe) {
        return multiTimeframeAnalysis.timeframeAnalyses[timeframe];
    }
}

module.exports = new MultiTimeframeAnalysisService();