const technicalAnalysisService = require('./technicalAnalysisService');
const newsAnalysisService = require('./newsAnalysisService');
const algorithmicAnalysisService = require('./algorithmicAnalysisService');

class DecisionService {
    constructor() {
        this.weights = {
            technical: 0.4,
            news: 0.25,
            algorithmic: 0.35
        };
    }

    // Proceso principal de toma de decisiones
    async makeDecision(pair, timeframe = '1h') {
        try {
            console.log(`Analizando ${pair} en timeframe ${timeframe}...`);

            // 1. Obtener datos históricos
            const historicalData = await this.getHistoricalData(pair, timeframe);
            
            // 2. Análisis técnico
            const technicalAnalysis = technicalAnalysisService.performFullAnalysis(historicalData);
            
            // 3. Análisis de noticias
            const news = await newsAnalysisService.getForexNews();
            const relevantNews = newsAnalysisService.getNewsForPair(news, pair);
            const newsSentiment = newsAnalysisService.getMarketSentiment(relevantNews);
            
            // 4. Análisis algorítmico
            const algorithmicAnalysis = await algorithmicAnalysisService.runAllStrategies(
                historicalData, 
                technicalAnalysis
            );

            // 5. Integrar todos los análisis
            const integratedAnalysis = this.integrateAnalyses({
                technical: technicalAnalysis,
                news: { sentiment: newsSentiment, relevantNews },
                algorithmic: algorithmicAnalysis
            });

            // 6. Generar decisión final
            const decision = this.generateFinalDecision(integratedAnalysis, pair);

            return {
                pair,
                timeframe,
                timestamp: Date.now(),
                decision,
                analysis: integratedAnalysis,
                confidence: decision.confidence,
                actionable: decision.confidence > 0.6
            };

        } catch (error) {
            console.error('Error en proceso de decisión:', error.message);
            throw error;
        }
    }

    async getHistoricalData(pair, timeframe) {
        const forexDataService = require('./forexDataService');
        return await forexDataService.getHistoricalData(pair, timeframe, 100);
    }

    // Integrar todos los análisis con pesos
    integrateAnalyses(analyses) {
        const { technical, news, algorithmic } = analyses;

        // Convertir análisis a valores numéricos (-1 a 1)
        const technicalScore = this.convertAnalysisToScore(technical);
        const newsScore = this.convertNewsToScore(news.sentiment);
        const algorithmicScore = this.convertAlgorithmicToScore(algorithmic);

        // Calcular score ponderado
        const weightedScore = 
            (technicalScore * this.weights.technical) +
            (newsScore * this.weights.news) +
            (algorithmicScore * this.weights.algorithmic);

        return {
            technical: technical,
            news: news,
            algorithmic: algorithmic,
            weightedScore,
            rawScores: {
                technical: technicalScore,
                news: newsScore,
                algorithmic: algorithmicScore
            }
        };
    }

    convertAnalysisToScore(technical) {
        let score = 0;

        // Sentimiento de velas
        if (technical.candlestick.overallSentiment) {
            const sentiment = technical.candlestick.overallSentiment;
            if (sentiment.sentiment === 'bullish') {
                score += sentiment.confidence;
            } else if (sentiment.sentiment === 'bearish') {
                score -= sentiment.confidence;
            }
        }

        // Tendencia
        if (technical.trend) {
            if (technical.trend.direction === 'bullish') {
                score += technical.trend.strength * 0.5;
            } else if (technical.trend.direction === 'bearish') {
                score -= technical.trend.strength * 0.5;
            }
        }

        // Indicadores RSI
        if (technical.indicators.rsi) {
            const rsi = technical.indicators.rsi;
            if (rsi < 30) score += 0.3; // Sobreventa - potencial alcista
            else if (rsi > 70) score -= 0.3; // Sobrecompra - potencial bajista
        }

        // MACD
        if (technical.indicators.macd) {
            const macd = technical.indicators.macd;
            if (macd.MACD > macd.signal) score += 0.2;
            else score -= 0.2;
        }

        return Math.max(-1, Math.min(1, score));
    }

    convertNewsToScore(newsSentiment) {
        if (!newsSentiment) return 0;

        let score = 0;
        if (newsSentiment.sentiment === 'bullish') {
            score = newsSentiment.confidence;
        } else if (newsSentiment.sentiment === 'bearish') {
            score = -newsSentiment.confidence;
        }

        return score;
    }

    convertAlgorithmicToScore(algorithmic) {
        if (!algorithmic || !algorithmic.recommendation) return 0;

        const { action, confidence } = algorithmic.recommendation;
        
        if (action === 'buy') return confidence;
        if (action === 'sell') return -confidence;
        return 0;
    }

    // Generar decisión final
    generateFinalDecision(integratedAnalysis, pair) {
        const { weightedScore, rawScores } = integratedAnalysis;
        
        let action = 'hold';
        let confidence = 0;
        let reasons = [];

        // Determinar acción basada en score ponderado
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

        // Añadir razones específicas
        if (rawScores.technical > 0.5) reasons.push('Fuerte señal técnica alcista');
        if (rawScores.technical < -0.5) reasons.push('Fuerte señal técnica bajista');
        if (rawScores.news > 0.4) reasons.push('Noticias favorables');
        if (rawScores.news < -0.4) reasons.push('Noticias desfavorables');
        if (rawScores.algorithmic > 0.5) reasons.push('Estrategias algorítmicas alineadas alcistas');
        if (rawScores.algorithmic < -0.5) reasons.push('Estrategias algorítmicas alineadas bajistas');

        // Niveles de soporte y resistencia
        const supportResistance = integratedAnalysis.technical.supportResistance;
        const currentPrice = supportResistance?.currentPrice || 0;

        return {
            action,
            confidence: Math.min(confidence, 1),
            reasons,
            currentPrice,
            support: supportResistance?.support,
            resistance: supportResistance?.resistance,
            riskLevel: this.calculateRiskLevel(integratedAnalysis),
            timeframe: this.suggestTimeframe(integratedAnalysis)
        };
    }

    calculateRiskLevel(integratedAnalysis) {
        const { technical, weightedScore } = integratedAnalysis;
        
        let risk = 'medium';
        
        // Volatilidad basada en RSI
        if (technical.indicators.rsi) {
            const rsi = technical.indicators.rsi;
            if (rsi < 20 || rsi > 80) risk = 'high';
            else if (rsi > 40 && rsi < 60) risk = 'low';
        }

        // Conflicto de señales
        const scores = Object.values(integratedAnalysis.rawScores);
        const variance = this.calculateVariance(scores);
        if (variance > 0.5) risk = 'high';

        return risk;
    }

    calculateVariance(values) {
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
        return squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
    }

    suggestTimeframe(integratedAnalysis) {
        const { technical, algorithmic } = integratedAnalysis;
        
        // Basar sugerencia en fuerza de tendencia
        if (technical.trend?.strength > 0.7) {
            return 'medium_term'; // 15m - 1h
        } else if (algorithmic.consensus?.strength > 0.6) {
            return 'short_term'; // 5m - 15m
        } else {
            return 'scalping'; // 1m - 5m
        }
    }

    // Análisis multi-timeframe
    async performMultiTimeframeAnalysis(pair) {
        const timeframes = ['1m', '5m', '15m', '1h'];
        const analyses = {};

        for (const tf of timeframes) {
            try {
                analyses[tf] = await this.makeDecision(pair, tf);
            } catch (error) {
                console.error(`Error analizando timeframe ${tf}:`, error.message);
                analyses[tf] = null;
            }
        }

        return this.combineMultiTimeframeAnalyses(analyses);
    }

    combineMultiTimeframeAnalyses(analyses) {
        const validAnalyses = Object.values(analyses).filter(a => a !== null);
        
        if (validAnalyses.length === 0) {
            return { action: 'hold', confidence: 0, reason: 'No hay análisis válidos' };
        }

        // Priorizar timeframes más largos
        const weights = {
            '1h': 0.4,
            '15m': 0.3,
            '5m': 0.2,
            '1m': 0.1
        };

        let totalScore = 0;
        let totalWeight = 0;

        validAnalyses.forEach(analysis => {
            const weight = weights[analysis.timeframe] || 0.25;
            const score = analysis.decision.action === 'buy' ? analysis.decision.confidence :
                         analysis.decision.action === 'sell' ? -analysis.decision.confidence : 0;
            
            totalScore += score * weight;
            totalWeight += weight;
        });

        const finalScore = totalWeight > 0 ? totalScore / totalWeight : 0;

        let action = 'hold';
        if (finalScore > 0.3) action = 'buy';
        else if (finalScore < -0.3) action = 'sell';

        return {
            action,
            confidence: Math.abs(finalScore),
            reason: 'Análisis multi-timeframe integrado',
            timeframeAnalysis: analyses
        };
    }
}

module.exports = new DecisionService();