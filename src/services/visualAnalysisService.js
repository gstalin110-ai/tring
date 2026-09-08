const sharp = require('sharp');
const Jimp = require('jimp');

/**
 * Servicio de análisis visual avanzado
 * Procesa imágenes de cámara o pantalla compartida para análisis de gráficos
 */
class VisualAnalysisService {
    constructor() {
        this.analysisHistory = [];
        this.maxHistorySize = 50;
        this.isProcessing = false;
    }

    /**
     * Procesar imagen de cámara o pantalla compartida
     * @param {Buffer} imageBuffer - Buffer de imagen
     * @param {Object} options - Opciones de análisis
     * @returns {Promise<Object>} Resultado del análisis visual
     */
    async processVisualInput(imageBuffer, options = {}) {
        try {
            if (this.isProcessing) {
                throw new Error('Ya hay un procesamiento en curso');
            }

            this.isProcessing = true;

            console.log('Iniciando análisis visual avanzado...');

            // 1. Preprocesamiento de imagen
            const processedImage = await this.preprocessImage(imageBuffer, options);

            // 2. Detección de elementos del gráfico
            const chartElements = await this.detectChartElements(processedImage);

            // 3. Análisis de patrones visuales
            const patternAnalysis = await this.analyzeVisualPatterns(chartElements);

            // 4. Extracción de datos numéricos (OCR simulado)
            const numericalData = await this.extractNumericalData(processedImage);

            // 5. Análisis de tendencias visuales
            const trendAnalysis = await this.analyzeVisualTrends(chartElements);

            // 6. Integración de análisis visual
            const visualAnalysis = this.integrateVisualAnalysis({
                chartElements,
                patternAnalysis,
                numericalData,
                trendAnalysis
            });

            // Guardar en historial
            this.addToHistory(visualAnalysis);

            this.isProcessing = false;

            return {
                success: true,
                timestamp: Date.now(),
                visualAnalysis,
                confidence: this.calculateVisualConfidence(visualAnalysis),
                dataSource: 'visual'
            };

        } catch (error) {
            this.isProcessing = false;
            console.error('Error en análisis visual:', error.message);
            throw error;
        }
    }

    /**
     * Preprocesamiento de imagen
     */
    async preprocessImage(imageBuffer, options) {
        try {
            // Convertir a formato estándar y optimizar
            let image = sharp(imageBuffer);

            // Redimensionar si es necesario (max 1920x1080)
            image = image.resize(1920, 1080, {
                fit: 'inside',
                withoutEnlargement: true
            });

            // Mejorar contraste
            if (options.enhanceContrast !== false) {
                image = image.normalize();
            }

            // Convertir a escala de grises para análisis
            const grayscaleBuffer = await image.grayscale().toBuffer();

            // Obtener metadatos
            const metadata = await sharp(imageBuffer).metadata();

            return {
                original: imageBuffer,
                processed: grayscaleBuffer,
                metadata,
                width: metadata.width,
                height: metadata.height
            };

        } catch (error) {
            console.error('Error en preprocesamiento:', error.message);
            throw error;
        }
    }

    /**
     * Detección de elementos del gráfico
     */
    async detectChartElements(processedImage) {
        try {
            // En una implementación real con OpenCV, aquí detectaríamos:
            // - Líneas de tendencia
            // - Velas japonesas
            // - Niveles de soporte/resistencia
            // - Indicadores visuales
            // - Ejes de precio y tiempo

            // Simulación de detección
            const elements = {
                candles: this.detectCandles(processedImage),
                trendLines: this.detectTrendLines(processedImage),
                supportResistance: this.detectSupportResistance(processedImage),
                indicators: this.detectIndicators(processedImage),
                axes: this.detectAxes(processedImage)
            };

            return elements;

        } catch (error) {
            console.error('Error en detección de elementos:', error.message);
            return {
                candles: [],
                trendLines: [],
                supportResistance: [],
                indicators: [],
                axes: []
            };
        }
    }

    /**
     * Detectar velas japonesas (simulado)
     */
    detectCandles(processedImage) {
        // En implementación real: usar OpenCV para detectar rectángulos de velas
        // Aquí simulamos detección
        
        const candleCount = Math.floor(Math.random() * 20) + 10;
        const candles = [];

        for (let i = 0; i < candleCount; i++) {
            candles.push({
                x: Math.random() * processedImage.width,
                y: Math.random() * processedImage.height,
                width: Math.random() * 50 + 20,
                height: Math.random() * 100 + 30,
                type: Math.random() > 0.5 ? 'bullish' : 'bearish',
                confidence: Math.random() * 0.3 + 0.7
            });
        }

        return candles;
    }

    /**
     * Detectar líneas de tendencia (simulado)
     */
    detectTrendLines(processedImage) {
        const lineCount = Math.floor(Math.random() * 5) + 2;
        const lines = [];

        for (let i = 0; i < lineCount; i++) {
            lines.push({
                type: Math.random() > 0.5 ? 'support' : 'resistance',
                slope: (Math.random() - 0.5) * 2,
                confidence: Math.random() * 0.4 + 0.6,
                points: Math.floor(Math.random() * 3) + 2
            });
        }

        return lines;
    }

    /**
     * Detectar soportes y resistencias (simulado)
     */
    detectSupportResistance(processedImage) {
        const levels = [];
        const levelCount = Math.floor(Math.random() * 4) + 2;

        for (let i = 0; i < levelCount; i++) {
            levels.push({
                type: Math.random() > 0.5 ? 'support' : 'resistance',
                strength: Math.random() * 0.5 + 0.5,
                price: Math.random() * 2 + 0.5,
                confidence: Math.random() * 0.3 + 0.7
            });
        }

        return levels;
    }

    /**
     * Detectar indicadores visuales (simulado)
     */
    detectIndicators(processedImage) {
        const indicators = [];
        const possibleIndicators = ['MA', 'EMA', 'BB', 'RSI', 'MACD', 'Volume'];

        const detectedCount = Math.floor(Math.random() * 4) + 1;
        const shuffled = possibleIndicators.sort(() => 0.5 - Math.random());

        for (let i = 0; i < detectedCount; i++) {
            indicators.push({
                type: shuffled[i],
                confidence: Math.random() * 0.3 + 0.7,
                visible: true
            });
        }

        return indicators;
    }

    /**
     * Detectar ejes del gráfico (simulado)
     */
    detectAxes(processedImage) {
        return {
            priceAxis: {
                detected: true,
                position: 'right',
                confidence: 0.8
            },
            timeAxis: {
                detected: true,
                position: 'bottom',
                confidence: 0.85
            }
        };
    }

    /**
     * Analizar patrones visuales
     */
    async analyzeVisualPatterns(chartElements) {
        const patterns = [];

        // Analizar patrones de velas detectados
        const bullishCandles = chartElements.candles.filter(c => c.type === 'bullish').length;
        const bearishCandles = chartElements.candles.filter(c => c.type === 'bearish').length;

        if (bullishCandles > bearishCandles * 1.5) {
            patterns.push({
                name: 'Dominio Alcista Visual',
                type: 'bullish',
                confidence: 0.7,
                description: 'Predominancia visual de velas alcistas'
            });
        } else if (bearishCandles > bullishCandles * 1.5) {
            patterns.push({
                name: 'Dominio Bajista Visual',
                type: 'bearish',
                confidence: 0.7,
                description: 'Predominancia visual de velas bajistas'
            });
        }

        // Analizar líneas de tendencia
        const supportLines = chartElements.trendLines.filter(l => l.type === 'support');
        const resistanceLines = chartElements.trendLines.filter(l => l.type === 'resistance');

        if (supportLines.length > resistanceLines.length) {
            patterns.push({
                name: 'Soporte Visual Detectado',
                type: 'bullish',
                confidence: 0.6,
                description: 'Múltiples líneas de soporte detectadas'
            });
        } else if (resistanceLines.length > supportLines.length) {
            patterns.push({
                name: 'Resistencia Visual Detectada',
                type: 'bearish',
                confidence: 0.6,
                description: 'Múltiples líneas de resistencia detectadas'
            });
        }

        return patterns;
    }

    /**
     * Extraer datos numéricos (OCR simulado)
     */
    async extractNumericalData(processedImage) {
        // En implementación real: usar Tesseract.js para OCR
        // Aquí simulamos extracción de precios y otros datos

        return {
            currentPrice: (Math.random() * 2 + 0.5).toFixed(5),
            detectedPrices: [
                (Math.random() * 2 + 0.5).toFixed(5),
                (Math.random() * 2 + 0.5).toFixed(5),
                (Math.random() * 2 + 0.5).toFixed(5)
            ],
            confidence: 0.75,
            ocrAvailable: false // Sería true con Tesseract real
        };
    }

    /**
     * Analizar tendencias visuales
     */
    async analyzeVisualTrends(chartElements) {
        const trendAnalysis = {
            direction: 'neutral',
            strength: 0,
            visualClarity: 0,
            patternRecognition: []
        };

        // Analizar dirección basada en elementos detectados
        const bullishElements = chartElements.candles.filter(c => c.type === 'bullish').length +
                                chartElements.trendLines.filter(l => l.type === 'support').length;
        
        const bearishElements = chartElements.candles.filter(c => c.type === 'bearish').length +
                                chartElements.trendLines.filter(l => l.type === 'resistance').length;

        if (bullishElements > bearishElements * 1.3) {
            trendAnalysis.direction = 'bullish';
            trendAnalysis.strength = Math.min((bullishElements / (bullishElements + bearishElements)), 1);
        } else if (bearishElements > bullishElements * 1.3) {
            trendAnalysis.direction = 'bearish';
            trendAnalysis.strength = Math.min((bearishElements / (bullishElements + bearishElements)), 1);
        }

        // Calcular claridad visual
        trendAnalysis.visualClarity = Math.min(
            (chartElements.candles.length + chartElements.trendLines.length) / 20,
            1
        );

        return trendAnalysis;
    }

    /**
     * Integrar análisis visual
     */
    integrateVisualAnalysis(components) {
        const { chartElements, patternAnalysis, numericalData, trendAnalysis } = components;

        return {
            elementsDetected: {
                candles: chartElements.candles.length,
                trendLines: chartElements.trendLines.length,
                supportResistance: chartElements.supportResistance.length,
                indicators: chartElements.indicators.length
            },
            patterns: patternAnalysis,
            numericalData,
            trend: trendAnalysis,
            overallSentiment: this.calculateVisualSentiment(components),
            dataQuality: this.assessVisualDataQuality(components)
        };
    }

    /**
     * Calcular sentimiento visual
     */
    calculateVisualSentiment(components) {
        const { patternAnalysis, trendAnalysis } = components;

        let bullishScore = 0;
        let bearishScore = 0;

        // Patrones
        patternAnalysis.forEach(pattern => {
            if (pattern.type === 'bullish') bullishScore += pattern.confidence;
            else if (pattern.type === 'bearish') bearishScore += pattern.confidence;
        });

        // Tendencia
        if (trendAnalysis.direction === 'bullish') {
            bullishScore += trendAnalysis.strength;
        } else if (trendAnalysis.direction === 'bearish') {
            bearishScore += trendAnalysis.strength;
        }

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

    /**
     * Evaluar calidad de datos visuales
     */
    assessVisualDataQuality(components) {
        const { chartElements, trendAnalysis } = components;

        let qualityScore = 0;

        // Cantidad de elementos detectados
        qualityScore += Math.min(chartElements.candles.length / 15, 0.3);
        qualityScore += Math.min(chartElements.trendLines.length / 5, 0.2);
        qualityScore += Math.min(chartElements.indicators.length / 4, 0.2);

        // Claridad visual
        qualityScore += trendAnalysis.visualClarity * 0.3;

        // Normalizar
        qualityScore = Math.min(qualityScore, 1);

        let quality = 'low';
        if (qualityScore > 0.7) quality = 'high';
        else if (qualityScore > 0.4) quality = 'medium';

        return { quality, score: qualityScore };
    }

    /**
     * Calcular confianza del análisis visual
     */
    calculateVisualConfidence(visualAnalysis) {
        const { dataQuality, trend, overallSentiment } = visualAnalysis;

        const baseConfidence = dataQuality.score;
        const trendConfidence = trend.strength;
        const sentimentConfidence = overallSentiment.confidence;

        return (baseConfidence + trendConfidence + sentimentConfidence) / 3;
    }

    /**
     * Añadir al historial
     */
    addToHistory(analysis) {
        this.analysisHistory.unshift({
            ...analysis,
            timestamp: Date.now()
        });

        if (this.analysisHistory.length > this.maxHistorySize) {
            this.analysisHistory.pop();
        }
    }

    /**
     * Obtener historial
     */
    getHistory(limit = 10) {
        return this.analysisHistory.slice(0, limit);
    }

    /**
     * Limpiar historial
     */
    clearHistory() {
        this.analysisHistory = [];
    }

    /**
     * Estado del procesamiento
     */
    getProcessingStatus() {
        return {
            isProcessing: this.isProcessing,
            historySize: this.analysisHistory.length
        };
    }
}

module.exports = new VisualAnalysisService();