class AlgorithmicAnalysisService {
    constructor() {
        this.strategies = {
            trendFollowing: this.trendFollowingStrategy.bind(this),
            meanReversion: this.meanReversionStrategy.bind(this),
            momentum: this.momentumStrategy.bind(this),
            breakout: this.breakoutStrategy.bind(this),
            volumeAnalysis: this.volumeAnalysisStrategy.bind(this)
        };
    }

    // Ejecutar todas las estrategias algorítmicas
    async runAllStrategies(data, technicalAnalysis) {
        const results = {};

        for (const [strategyName, strategy] of Object.entries(this.strategies)) {
            try {
                results[strategyName] = strategy(data, technicalAnalysis);
            } catch (error) {
                console.error(`Error en estrategia ${strategyName}:`, error.message);
                results[strategyName] = { signal: 'neutral', confidence: 0 };
            }
        }

        return {
            strategies: results,
            consensus: this.calculateConsensus(results),
            recommendation: this.generateRecommendation(results)
        };
    }

    // Estrategia de seguimiento de tendencia
    trendFollowingStrategy(data, technicalAnalysis) {
        const { indicators, trend } = technicalAnalysis;
        
        if (!indicators.sma20 || !indicators.sma50) {
            return { signal: 'neutral', confidence: 0 };
        }

        const currentPrice = data[data.length - 1].close;
        const sma20 = indicators.sma20;
        const sma50 = indicators.sma50;

        let signal = 'neutral';
        let confidence = 0;

        // Cruce de medias móviles
        if (sma20 > sma50 && currentPrice > sma20) {
            signal = 'buy';
            confidence = 0.7;
        } else if (sma20 < sma50 && currentPrice < sma20) {
            signal = 'sell';
            confidence = 0.7;
        }

        // Confirmar con tendencia
        if (trend.direction === signal) {
            confidence = Math.min(confidence + 0.2, 1);
        } else if (trend.direction !== 'neutral') {
            confidence = Math.max(confidence - 0.2, 0);
        }

        return { signal, confidence, reason: 'Trend Following' };
    }

    // Estrategia de reversión a la media
    meanReversionStrategy(data, technicalAnalysis) {
        const { indicators, supportResistance } = technicalAnalysis;
        
        if (!indicators.rsi || !supportResistance) {
            return { signal: 'neutral', confidence: 0 };
        }

        const currentPrice = data[data.length - 1].close;
        const rsi = indicators.rsi;
        const { support, resistance } = supportResistance;

        let signal = 'neutral';
        let confidence = 0;

        // Sobreventa cerca de soporte
        if (rsi < 30 && currentPrice <= support * 1.01) {
            signal = 'buy';
            confidence = 0.8;
        }
        // Sobrecompra cerca de resistencia
        else if (rsi > 70 && currentPrice >= resistance * 0.99) {
            signal = 'sell';
            confidence = 0.8;
        }
        // RSI extremo sin considerar niveles
        else if (rsi < 20) {
            signal = 'buy';
            confidence = 0.6;
        } else if (rsi > 80) {
            signal = 'sell';
            confidence = 0.6;
        }

        return { signal, confidence, reason: 'Mean Reversion' };
    }

    // Estrategia de momentum
    momentumStrategy(data, technicalAnalysis) {
        const { indicators } = technicalAnalysis;
        
        if (!indicators.macd || !indicators.rsi) {
            return { signal: 'neutral', confidence: 0 };
        }

        const macd = indicators.macd;
        const rsi = indicators.rsi;

        let signal = 'neutral';
        let confidence = 0;

        // MACD cruzando sobre la señal
        if (macd.MACD > macd.signal && macd.histogram > 0) {
            signal = 'buy';
            confidence = 0.6;
        } else if (macd.MACD < macd.signal && macd.histogram < 0) {
            signal = 'sell';
            confidence = 0.6;
        }

        // Confirmar con RSI
        if (signal === 'buy' && rsi > 50 && rsi < 70) {
            confidence += 0.2;
        } else if (signal === 'sell' && rsi < 50 && rsi > 30) {
            confidence += 0.2;
        }

        return { signal, confidence: Math.min(confidence, 1), reason: 'Momentum' };
    }

    // Estrategia de ruptura (breakout)
    breakoutStrategy(data, technicalAnalysis) {
        const { indicators, supportResistance } = technicalAnalysis;
        
        if (!supportResistance || !indicators.bollinger) {
            return { signal: 'neutral', confidence: 0 };
        }

        const currentPrice = data[data.length - 1].close;
        const { support, resistance } = supportResistance;
        const bollinger = indicators.bollinger;

        let signal = 'neutral';
        let confidence = 0;

        // Ruptura de resistencia
        if (currentPrice > resistance && currentPrice > bollinger.upper) {
            signal = 'buy';
            confidence = 0.8;
        }
        // Ruptura de soporte
        else if (currentPrice < support && currentPrice < bollinger.lower) {
            signal = 'sell';
            confidence = 0.8;
        }
        // Aproximación a bandas de Bollinger
        else if (currentPrice > bollinger.upper * 0.99) {
            signal = 'buy';
            confidence = 0.5;
        } else if (currentPrice < bollinger.lower * 1.01) {
            signal = 'sell';
            confidence = 0.5;
        }

        return { signal, confidence, reason: 'Breakout' };
    }

    // Estrategia de análisis de volumen
    volumeAnalysisStrategy(data, technicalAnalysis) {
        if (!data || data.length < 20) {
            return { signal: 'neutral', confidence: 0 };
        }

        const recentData = data.slice(-5);
        const currentCandle = data[data.length - 1];
        const previousCandle = data[data.length - 2];

        // Calcular volumen promedio
        const avgVolume = data.slice(-20).reduce((sum, d) => sum + (d.volume || 0), 0) / 20;
        const currentVolume = currentCandle.volume || 0;

        let signal = 'neutral';
        let confidence = 0;

        // Volumen inusualmente alto
        if (currentVolume > avgVolume * 1.5) {
            const priceChange = (currentCandle.close - previousCandle.close) / previousCandle.close;
            
            if (priceChange > 0) {
                signal = 'buy';
                confidence = 0.7;
            } else if (priceChange < 0) {
                signal = 'sell';
                confidence = 0.7;
            }
        }

        return { signal, confidence, reason: 'Volume Analysis' };
    }

    // Calcular consenso entre estrategias
    calculateConsensus(strategyResults) {
        const signals = Object.values(strategyResults).map(r => r.signal);
        
        const buyCount = signals.filter(s => s === 'buy').length;
        const sellCount = signals.filter(s => s === 'sell').length;
        const neutralCount = signals.filter(s => s === 'neutral').length;

        const total = signals.length;
        
        if (buyCount > sellCount && buyCount > neutralCount) {
            return { direction: 'buy', strength: buyCount / total };
        } else if (sellCount > buyCount && sellCount > neutralCount) {
            return { direction: 'sell', strength: sellCount / total };
        } else {
            return { direction: 'neutral', strength: 0 };
        }
    }

    // Generar recomendación final
    generateRecommendation(strategyResults) {
        const consensus = this.calculateConsensus(strategyResults);
        
        if (consensus.strength < 0.4) {
            return {
                action: 'hold',
                confidence: consensus.strength,
                reason: 'Sin consenso suficiente entre estrategias'
            };
        }

        // Calcular confianza promedio de estrategias alineadas
        const alignedStrategies = Object.values(strategyResults).filter(
            r => r.signal === consensus.direction
        );
        
        const avgConfidence = alignedStrategies.length > 0
            ? alignedStrategies.reduce((sum, r) => sum + r.confidence, 0) / alignedStrategies.length
            : 0;

        return {
            action: consensus.direction,
            confidence: Math.min(consensus.strength * avgConfidence * 1.5, 1),
            reason: `Consenso de ${alignedStrategies.length} estrategias`,
            contributingStrategies: alignedStrategies.map(s => s.reason)
        };
    }

    // Análisis avanzado de correlaciones
    analyzeCorrelations(data1, data2) {
        if (!data1 || !data2 || data1.length !== data2.length) {
            return { correlation: 0, significance: 'low' };
        }

        const returns1 = this.calculateReturns(data1);
        const returns2 = this.calculateReturns(data2);

        const correlation = this.calculatePearsonCorrelation(returns1, returns2);
        
        let significance = 'low';
        if (Math.abs(correlation) > 0.7) significance = 'high';
        else if (Math.abs(correlation) > 0.4) significance = 'medium';

        return { correlation, significance };
    }

    calculateReturns(data) {
        const returns = [];
        for (let i = 1; i < data.length; i++) {
            returns.push((data[i].close - data[i-1].close) / data[i-1].close);
        }
        return returns;
    }

    calculatePearsonCorrelation(x, y) {
        const n = x.length;
        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
        const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
        const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

        const numerator = n * sumXY - sumX * sumY;
        const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

        return denominator === 0 ? 0 : numerator / denominator;
    }
}

module.exports = new AlgorithmicAnalysisService();