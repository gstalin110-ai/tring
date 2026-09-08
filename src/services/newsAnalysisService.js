const axios = require('axios');

class NewsAnalysisService {
    constructor() {
        this.newsCache = new Map();
        this.cacheTimeout = 300000; // 5 minutos
        this.impactKeywords = {
            high: ['crisis', 'recesión', 'guerra', 'inflación', 'desempleo', 'bancarrota', 'default', 'sanciones'],
            medium: ['pib', 'tasas', 'referendum', 'elecciones', 'brexit', 'acuerdo', 'tratado'],
            low: ['reporte', 'anuncio', 'conferencia', 'reunión', 'datos']
        };
    }

    async getForexNews() {
        try {
            // Usar APIs gratuitas de noticias financieras
            const news = await Promise.allSettled([
                this.getFromEconomicCalendar(),
                this.getFromNewsAPI()
            ]);

            const allNews = [];
            news.forEach(result => {
                if (result.status === 'fulfilled' && result.value) {
                    allNews.push(...result.value);
                }
            });

            // Analizar impacto de cada noticia
            const analyzedNews = allNews.map(newsItem => ({
                ...newsItem,
                impact: this.analyzeNewsImpact(newsItem),
                timestamp: Date.now()
            }));

            // Cachear resultados
            this.newsCache.set('forex_news', {
                data: analyzedNews,
                timestamp: Date.now()
            });

            return analyzedNews;
        } catch (error) {
            console.error('Error obteniendo noticias forex:', error.message);
            return [];
        }
    }

    async getFromEconomicCalendar() {
        try {
            // Simulación de calendario económico (en producción usar API real)
            return [
                {
                    title: 'Decision de tasas de interés FED',
                    description: 'La Reserva Federal anuncia su decisión sobre tasas de interés',
                    datetime: new Date(Date.now() + 3600000).toISOString(),
                    currency: 'USD',
                    importance: 'high'
                },
                {
                    title: 'Reporte de inflación Eurozona',
                    description: 'Publicación de datos de IPC mensual',
                    datetime: new Date(Date.now() + 7200000).toISOString(),
                    currency: 'EUR',
                    importance: 'medium'
                }
            ];
        } catch (error) {
            console.error('Error Economic Calendar:', error.message);
            return [];
        }
    }

    async getFromNewsAPI() {
        try {
            // En producción usar NewsAPI o similar
            return [
                {
                    title: 'Analistas predicen fortalecimiento del dólar',
                    description: 'Economistas anticipan movimiento alcista del USD tras datos económicos positivos',
                    source: 'Financial Times',
                    url: 'https://example.com/news1',
                    publishedAt: new Date().toISOString()
                },
                {
                    title: 'Brexit afecta relaciones comerciales UK-EU',
                    description: 'Nuevas regulaciones impactan el GBP',
                    source: 'Reuters',
                    url: 'https://example.com/news2',
                    publishedAt: new Date(Date.now() - 3600000).toISOString()
                }
            ];
        } catch (error) {
            console.error('Error News API:', error.message);
            return [];
        }
    }

    analyzeNewsImpact(newsItem) {
        const text = `${newsItem.title} ${newsItem.description || ''}`.toLowerCase();
        let impact = {
            level: 'low',
            sentiment: 'neutral',
            affectedPairs: [],
            score: 0
        };

        // Analizar palabras clave de impacto
        for (const [level, keywords] of Object.entries(this.impactKeywords)) {
            for (const keyword of keywords) {
                if (text.includes(keyword)) {
                    impact.level = level;
                    impact.score += level === 'high' ? 3 : level === 'medium' ? 2 : 1;
                }
            }
        }

        // Determinar sentimiento
        const positiveWords = ['crecimiento', 'aumento', 'fortalecimiento', 'mejora', 'positivo', 'alcista'];
        const negativeWords = ['caída', 'disminución', 'debilitamiento', 'empeora', 'negativo', 'bajista'];

        let positiveScore = 0;
        let negativeScore = 0;

        positiveWords.forEach(word => {
            if (text.includes(word)) positiveScore++;
        });

        negativeWords.forEach(word => {
            if (text.includes(word)) negativeScore++;
        });

        if (positiveScore > negativeScore) {
            impact.sentiment = 'bullish';
        } else if (negativeScore > positiveScore) {
            impact.sentiment = 'bearish';
        }

        // Determinar pares afectados
        if (newsItem.currency) {
            const currencyPairs = this.getCurrencyPairs(newsItem.currency);
            impact.affectedPairs = currencyPairs;
        }

        return impact;
    }

    getCurrencyPairs(currency) {
        const pairs = {
            'USD': ['EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD', 'USD/CAD', 'NZD/USD'],
            'EUR': ['EUR/USD', 'EUR/GBP', 'EUR/JPY'],
            'GBP': ['GBP/USD', 'EUR/GBP', 'GBP/JPY'],
            'JPY': ['USD/JPY', 'EUR/JPY', 'GBP/JPY'],
            'CHF': ['USD/CHF', 'EUR/CHF', 'GBP/CHF'],
            'AUD': ['AUD/USD', 'EUR/AUD', 'GBP/AUD'],
            'CAD': ['USD/CAD', 'EUR/CAD', 'GBP/CAD'],
            'NZD': ['NZD/USD', 'EUR/NZD', 'GBP/NZD']
        };
        return pairs[currency] || [];
    }

    // Obtener sentimiento general del mercado basado en noticias
    getMarketSentiment(news) {
        if (!news || news.length === 0) {
            return { sentiment: 'neutral', confidence: 0 };
        }

        let bullishScore = 0;
        let bearishScore = 0;
        let totalImpact = 0;

        news.forEach(newsItem => {
            if (newsItem.impact) {
                if (newsItem.impact.sentiment === 'bullish') {
                    bullishScore += newsItem.impact.score;
                } else if (newsItem.impact.sentiment === 'bearish') {
                    bearishScore += newsItem.impact.score;
                }
                totalImpact += newsItem.impact.score;
            }
        });

        if (totalImpact === 0) {
            return { sentiment: 'neutral', confidence: 0 };
        }

        const bullishRatio = bullishScore / totalImpact;
        const confidence = Math.min(totalImpact / 10, 1); // Normalizar confianza

        if (bullishRatio > 0.6) {
            return { sentiment: 'bullish', confidence };
        } else if (bullishRatio < 0.4) {
            return { sentiment: 'bearish', confidence };
        } else {
            return { sentiment: 'neutral', confidence };
        }
    }

    // Obtener noticias relevantes para un par específico
    getNewsForPair(news, pair) {
        if (!news) return [];

        const currencies = pair.split('/');
        return news.filter(newsItem => {
            if (!newsItem.impact || !newsItem.impact.affectedPairs) return false;
            return newsItem.impact.affectedPairs.includes(pair);
        });
    }
}

module.exports = new NewsAnalysisService();