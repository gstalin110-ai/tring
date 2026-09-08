const TechnicalIndicators = require('technicalindicators');

class TechnicalAnalysisService {
    constructor() {
        this.indicators = {
            SMA: this.calculateSMA.bind(this),
            EMA: this.calculateEMA.bind(this),
            RSI: this.calculateRSI.bind(this),
            MACD: this.calculateMACD.bind(this),
            BOLLINGER: this.calculateBollingerBands.bind(this),
            STOCH: this.calculateStochastic.bind(this)
        };
    }

    // Análisis completo de velas japonesas
    analyzeCandlesticks(data) {
        if (!data || data.length < 3) return { signals: [], patterns: [] };

        const signals = [];
        const patterns = [];

        for (let i = 2; i < data.length; i++) {
            const candle = data[i];
            const prevCandle = data[i - 1];
            const prevPrevCandle = data[i - 2];

            // Patrones de velas
            patterns.push(...this.detectCandlePatterns(candle, prevCandle, prevPrevCandle));
            
            // Señales básicas
            signals.push(...this.generateBasicSignals(candle, prevCandle));
        }

        return {
            signals: this.filterSignals(signals),
            patterns: patterns,
            overallSentiment: this.calculateOverallSentiment(signals, patterns)
        };
    }

    detectCandlePatterns(candle, prevCandle, prevPrevCandle) {
        const patterns = [];
        const bodySize = Math.abs(candle.close - candle.open);
        const wickSize = candle.high - Math.max(candle.open, candle.close);
        const tailSize = Math.min(candle.open, candle.close) - candle.low;

        // Doji
        if (bodySize < (candle.high - candle.low) * 0.1) {
            patterns.push({ name: 'Doji', type: 'neutral', strength: 0.5 });
        }

        // Martillo (Hammer)
        if (tailSize > bodySize * 2 && wickSize < bodySize) {
            patterns.push({ name: 'Hammer', type: 'bullish', strength: 0.7 });
        }

        // Estrella fugaz (Shooting Star)
        if (wickSize > bodySize * 2 && tailSize < bodySize) {
            patterns.push({ name: 'Shooting Star', type: 'bearish', strength: 0.7 });
        }

        // Envolvente alcista (Bullish Engulfing)
        if (prevCandle.close < prevCandle.open && 
            candle.close > candle.open && 
            candle.open < prevCandle.close && 
            candle.close > prevCandle.open) {
            patterns.push({ name: 'Bullish Engulfing', type: 'bullish', strength: 0.8 });
        }

        // Envolvente bajista (Bearish Engulfing)
        if (prevCandle.close > prevCandle.open && 
            candle.close < candle.open && 
            candle.open > prevCandle.close && 
            candle.close < prevCandle.open) {
            patterns.push({ name: 'Bearish Engulfing', type: 'bearish', strength: 0.8 });
        }

        // Tres soldados blancos (Three White Soldiers)
        if (this.isThreeWhiteSoldados(candle, prevCandle, prevPrevCandle)) {
            patterns.push({ name: 'Three White Soldiers', type: 'bullish', strength: 0.9 });
        }

        // Tres cuervos negros (Three Black Crows)
        if (this.isThreeBlackCrows(candle, prevCandle, prevPrevCandle)) {
            patterns.push({ name: 'Three Black Crows', type: 'bearish', strength: 0.9 });
        }

        return patterns;
    }

    isThreeWhiteSoldados(candle, prevCandle, prevPrevCandle) {
        return candle.close > candle.open &&
               prevCandle.close > prevCandle.open &&
               prevPrevCandle.close > prevPrevCandle.open &&
               candle.close > prevCandle.close &&
               prevCandle.close > prevPrevCandle.close;
    }

    isThreeBlackCrows(candle, prevCandle, prevPrevCandle) {
        return candle.close < candle.open &&
               prevCandle.close < prevCandle.open &&
               prevPrevCandle.close < prevPrevCandle.open &&
               candle.close < prevCandle.close &&
               prevCandle.close < prevPrevCandle.close;
    }

    generateBasicSignals(candle, prevCandle) {
        const signals = [];
        const priceChange = ((candle.close - prevCandle.close) / prevCandle.close) * 100;

        // Tendencia basada en precio
        if (priceChange > 0.1) {
            signals.push({ type: 'buy', strength: Math.min(priceChange * 10, 1), reason: 'Precio subiendo' });
        } else if (priceChange < -0.1) {
            signals.push({ type: 'sell', strength: Math.min(Math.abs(priceChange) * 10, 1), reason: 'Precio bajando' });
        }

        // Volumen (si está disponible)
        if (candle.volume && prevCandle.volume) {
            const volumeChange = (candle.volume - prevCandle.volume) / prevCandle.volume;
            if (volumeChange > 0.5 && priceChange > 0) {
                signals.push({ type: 'buy', strength: 0.6, reason: 'Alto volumen alcista' });
            } else if (volumeChange > 0.5 && priceChange < 0) {
                signals.push({ type: 'sell', strength: 0.6, reason: 'Alto volumen bajista' });
            }
        }

        return signals;
    }

    filterSignals(signals) {
        // Filtrar señales débiles y consolidar
        const filtered = signals.filter(s => s.strength > 0.3);
        
        // Consolidar señales del mismo tipo
        const buySignals = filtered.filter(s => s.type === 'buy');
        const sellSignals = filtered.filter(s => s.type === 'sell');

        const avgBuyStrength = buySignals.length > 0 
            ? buySignals.reduce((sum, s) => sum + s.strength, 0) / buySignals.length 
            : 0;
        
        const avgSellStrength = sellSignals.length > 0 
            ? sellSignals.reduce((sum, s) => sum + s.strength, 0) / sellSignals.length 
            : 0;

        return {
            buy: avgBuyStrength,
            sell: avgSellStrength,
            count: filtered.length
        };
    }

    calculateOverallSentiment(signals, patterns) {
        let bullishScore = 0;
        let bearishScore = 0;

        // Añadir señales
        bullishScore += signals.buy || 0;
        bearishScore += signals.sell || 0;

        // Añadir patrones
        patterns.forEach(pattern => {
            if (pattern.type === 'bullish') {
                bullishScore += pattern.strength;
            } else if (pattern.type === 'bearish') {
                bearishScore += pattern.strength;
            }
        });

        const total = bullishScore + bearishScore;
        if (total === 0) return { sentiment: 'neutral', confidence: 0 };

        const bullishRatio = bullishScore / total;
        
        if (bullishRatio > 0.6) {
            return { sentiment: 'bullish', confidence: bullishRatio };
        } else if (bullishRatio < 0.4) {
            return { sentiment: 'bearish', confidence: 1 - bullishRatio };
        } else {
            return { sentiment: 'neutral', confidence: 0.5 };
        }
    }

    // Indicadores técnicos
    calculateSMA(data, period = 20) {
        try {
            const closes = data.map(d => d.close);
            const sma = TechnicalIndicators.SMA.calculate({ period, values: closes });
            return sma[sma.length - 1];
        } catch (error) {
            console.error('Error calculando SMA:', error.message);
            return null;
        }
    }

    calculateEMA(data, period = 20) {
        try {
            const closes = data.map(d => d.close);
            const ema = TechnicalIndicators.EMA.calculate({ period, values: closes });
            return ema[ema.length - 1];
        } catch (error) {
            console.error('Error calculando EMA:', error.message);
            return null;
        }
    }

    calculateRSI(data, period = 14) {
        try {
            const closes = data.map(d => d.close);
            const rsi = TechnicalIndicators.RSI.calculate({ period, values: closes });
            return rsi[rsi.length - 1];
        } catch (error) {
            console.error('Error calculando RSI:', error.message);
            return null;
        }
    }

    calculateMACD(data) {
        try {
            const closes = data.map(d => d.close);
            const macd = TechnicalIndicators.MACD.calculate({
                fastPeriod: 12,
                slowPeriod: 26,
                signalPeriod: 9,
                values: closes
            });
            return macd[macd.length - 1];
        } catch (error) {
            console.error('Error calculando MACD:', error.message);
            return null;
        }
    }

    calculateBollingerBands(data, period = 20, stdDev = 2) {
        try {
            const closes = data.map(d => d.close);
            const bb = TechnicalIndicators.BollingerBands.calculate({
                period, 
                stdDev, 
                values: closes
            });
            return bb[bb.length - 1];
        } catch (error) {
            console.error('Error calculando Bollinger Bands:', error.message);
            return null;
        }
    }

    calculateStochastic(data, period = 14) {
        try {
            const stoch = TechnicalIndicators.Stochastic.calculate({
                period,
                signalPeriod: 3,
                high: data.map(d => d.high),
                low: data.map(d => d.low),
                close: data.map(d => d.close)
            });
            return stoch[stoch.length - 1];
        } catch (error) {
            console.error('Error calculando Stochastic:', error.message);
            return null;
        }
    }

    // Análisis técnico completo
    performFullAnalysis(data) {
        const analysis = {
            candlestick: this.analyzeCandlesticks(data),
            indicators: {},
            trend: {},
            supportResistance: this.calculateSupportResistance(data)
        };

        // Calcular indicadores
        analysis.indicators.sma20 = this.calculateSMA(data, 20);
        analysis.indicators.sma50 = this.calculateSMA(data, 50);
        analysis.indicators.ema12 = this.calculateEMA(data, 12);
        analysis.indicators.ema26 = this.calculateEMA(data, 26);
        analysis.indicators.rsi = this.calculateRSI(data);
        analysis.indicators.macd = this.calculateMACD(data);
        analysis.indicators.bollinger = this.calculateBollingerBands(data);
        analysis.indicators.stochastic = this.calculateStochastic(data);

        // Determinar tendencia
        analysis.trend = this.determineTrend(analysis.indicators, data);

        return analysis;
    }

    determineTrend(indicators, data) {
        const currentPrice = data[data.length - 1].close;
        const sma20 = indicators.sma20;
        const sma50 = indicators.sma50;
        const rsi = indicators.rsi;

        let trend = 'neutral';
        let strength = 0;

        if (sma20 && sma50) {
            if (currentPrice > sma20 && sma20 > sma50) {
                trend = 'bullish';
                strength = 0.7;
            } else if (currentPrice < sma20 && sma20 < sma50) {
                trend = 'bearish';
                strength = 0.7;
            }
        }

        if (rsi) {
            if (rsi > 70) {
                trend = 'bearish'; // Sobrecompra
                strength = Math.max(strength, 0.6);
            } else if (rsi < 30) {
                trend = 'bullish'; // Sobreventa
                strength = Math.max(strength, 0.6);
            }
        }

        return { direction: trend, strength };
    }

    calculateSupportResistance(data, lookback = 20) {
        const highs = data.slice(-lookback).map(d => d.high);
        const lows = data.slice(-lookback).map(d => d.low);
        
        const resistance = Math.max(...highs);
        const support = Math.min(...lows);
        
        return {
            support,
            resistance,
            currentPrice: data[data.length - 1].close
        };
    }
}

module.exports = new TechnicalAnalysisService();