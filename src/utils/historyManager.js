const fs = require('fs').promises;
const path = require('path');

/**
 * Gestor de historial de análisis
 * Almacena el historial en archivos JSON
 */
class HistoryManager {
    constructor() {
        this.dataDir = path.join(process.cwd(), 'data');
        this.historyFile = path.join(this.dataDir, 'analysis_history.json');
        this.sessionFile = path.join(this.dataDir, 'current_session.json');
        this.currentSession = null;
        this.maxHistorySize = 1000;
    }

    /**
     * Inicializar directorio de datos
     */
    async initialize() {
        try {
            await fs.mkdir(this.dataDir, { recursive: true });
            
            // Crear archivo de historial si no existe
            try {
                await fs.access(this.historyFile);
            } catch {
                await this.createHistoryFile();
            }

            console.log('Historial inicializado correctamente');
        } catch (error) {
            console.error('Error inicializando historial:', error.message);
            throw error;
        }
    }

    /**
     * Crear archivo de historial
     */
    async createHistoryFile() {
        const initialData = {
            version: '1.0',
            created: Date.now(),
            analyses: [],
            sessions: []
        };
        
        await fs.writeFile(this.historyFile, JSON.stringify(initialData, null, 2));
    }

    /**
     * Iniciar nueva sesión
     */
    async startSession(config) {
        this.currentSession = {
            id: `session_${Date.now()}`,
            startTime: Date.now(),
            endTime: null,
            config: config,
            analyses: [],
            status: 'active'
        };

        await this.saveCurrentSession();
        console.log(`Sesión iniciada: ${this.currentSession.id}`);

        return this.currentSession;
    }

    /**
     * Finalizar sesión actual
     */
    async endSession() {
        if (!this.currentSession) {
            throw new Error('No hay sesión activa');
        }

        this.currentSession.endTime = Date.now();
        this.currentSession.status = 'completed';
        this.currentSession.duration = this.currentSession.endTime - this.currentSession.startTime;

        // Guardar sesión en historial general
        await this.addSessionToHistory(this.currentSession);

        // Limpiar sesión actual
        await this.clearCurrentSession();

        const sessionData = { ...this.currentSession };
        this.currentSession = null;

        console.log(`Sesión finalizada: ${sessionData.id}`);
        return sessionData;
    }

    /**
     * Guardar sesión actual
     */
    async saveCurrentSession() {
        if (!this.currentSession) return;

        await fs.writeFile(
            this.sessionFile, 
            JSON.stringify(this.currentSession, null, 2)
        );
    }

    /**
     * Cargar sesión actual
     */
    async loadCurrentSession() {
        try {
            const data = await fs.readFile(this.sessionFile, 'utf8');
            this.currentSession = JSON.parse(data);
            return this.currentSession;
        } catch (error) {
            return null;
        }
    }

    /**
     * Limpiar sesión actual
     */
    async clearCurrentSession() {
        this.currentSession = null;
        try {
            await fs.unlink(this.sessionFile);
        } catch (error) {
            // Archivo puede no existir
        }
    }

    /**
     * Añadir análisis a la sesión actual
     */
    async addAnalysis(analysis) {
        if (!this.currentSession) {
            throw new Error('No hay sesión activa');
        }

        const analysisRecord = {
            id: `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Date.now(),
            sessionId: this.currentSession.id,
            ...analysis
        };

        this.currentSession.analyses.push(analysisRecord);

        // También añadir al historial general
        await this.addAnalysisToHistory(analysisRecord);

        await this.saveCurrentSession();

        return analysisRecord;
    }

    /**
     * Añadir análisis al historial general
     */
    async addAnalysisToHistory(analysis) {
        try {
            const data = await fs.readFile(this.historyFile, 'utf8');
            const history = JSON.parse(data);

            history.analyses.unshift(analysis);

            // Limitar tamaño del historial
            if (history.analyses.length > this.maxHistorySize) {
                history.analyses = history.analyses.slice(0, this.maxHistorySize);
            }

            history.lastUpdated = Date.now();

            await fs.writeFile(this.historyFile, JSON.stringify(history, null, 2));
        } catch (error) {
            console.error('Error añadiendo análisis al historial:', error.message);
            throw error;
        }
    }

    /**
     * Añadir sesión al historial general
     */
    async addSessionToHistory(session) {
        try {
            const data = await fs.readFile(this.historyFile, 'utf8');
            const history = JSON.parse(data);

            history.sessions.unshift(session);

            // Limitar tamaño del historial de sesiones
            if (history.sessions.length > 100) {
                history.sessions = history.sessions.slice(0, 100);
            }

            history.lastUpdated = Date.now();

            await fs.writeFile(this.historyFile, JSON.stringify(history, null, 2));
        } catch (error) {
            console.error('Error añadiendo sesión al historial:', error.message);
            throw error;
        }
    }

    /**
     * Obtener historial de análisis
     */
    async getAnalysisHistory(limit = 50, filters = {}) {
        try {
            const data = await fs.readFile(this.historyFile, 'utf8');
            const history = JSON.parse(data);

            let analyses = history.analyses;

            // Aplicar filtros
            if (filters.pair) {
                analyses = analyses.filter(a => a.pair === filters.pair);
            }

            if (filters.startDate) {
                analyses = analyses.filter(a => a.timestamp >= filters.startDate);
            }

            if (filters.endDate) {
                analyses = analyses.filter(a => a.timestamp <= filters.endDate);
            }

            if (filters.signal) {
                analyses = analyses.filter(a => 
                    a.decision?.action === filters.signal ||
                    a.recommendation === filters.signal
                );
            }

            return analyses.slice(0, limit);
        } catch (error) {
            console.error('Error obteniendo historial:', error.message);
            return [];
        }
    }

    /**
     * Obtener historial de sesiones
     */
    async getSessionHistory(limit = 20) {
        try {
            const data = await fs.readFile(this.historyFile, 'utf8');
            const history = JSON.parse(data);

            return history.sessions.slice(0, limit);
        } catch (error) {
            console.error('Error obteniendo historial de sesiones:', error.message);
            return [];
        }
    }

    /**
     * Obtener análisis de una sesión específica
     */
    async getSessionAnalyses(sessionId) {
        try {
            const data = await fs.readFile(this.historyFile, 'utf8');
            const history = JSON.parse(data);

            return history.analyses.filter(a => a.sessionId === sessionId);
        } catch (error) {
            console.error('Error obteniendo análisis de sesión:', error.message);
            return [];
        }
    }

    /**
     * Obtener estadísticas del historial
     */
    async getStatistics() {
        try {
            const data = await fs.readFile(this.historyFile, 'utf8');
            const history = JSON.parse(data);

            const analyses = history.analyses;
            const sessions = history.sessions;

            const stats = {
                totalAnalyses: analyses.length,
                totalSessions: sessions.length,
                signals: { buy: 0, sell: 0, hold: 0 },
                byPair: {},
                avgConfidence: 0,
                totalDuration: 0
            };

            let totalConfidence = 0;

            analyses.forEach(analysis => {
                // Contar señales
                const signal = analysis.decision?.action || analysis.recommendation || 'hold';
                if (stats.signals[signal] !== undefined) {
                    stats.signals[signal]++;
                }

                // Por par
                const pair = analysis.pair || 'unknown';
                if (!stats.byPair[pair]) {
                    stats.byPair[pair] = 0;
                }
                stats.byPair[pair]++;

                // Confianza
                const confidence = analysis.confidence || analysis.decision?.confidence || 0;
                totalConfidence += confidence;
            });

            // Calcular promedios
            if (analyses.length > 0) {
                stats.avgConfidence = totalConfidence / analyses.length;
            }

            // Duración total de sesiones
            sessions.forEach(session => {
                if (session.duration) {
                    stats.totalDuration += session.duration;
                }
            });

            return stats;
        } catch (error) {
            console.error('Error obteniendo estadísticas:', error.message);
            return null;
        }
    }

    /**
     * Exportar historial a CSV
     */
    async exportToCSV(outputPath) {
        try {
            const analyses = await this.getAnalysisHistory(1000);
            
            if (analyses.length === 0) {
                throw new Error('No hay análisis para exportar');
            }

            const headers = ['ID', 'Timestamp', 'Pair', 'Signal', 'Confidence', 'Price', 'Source'];
            const rows = analyses.map(a => [
                a.id,
                new Date(a.timestamp).toISOString(),
                a.pair,
                a.decision?.action || a.recommendation,
                (a.confidence || a.decision?.confidence || 0).toFixed(3),
                a.decision?.currentPrice || a.currentPrice,
                a.dataSource || 'api'
            ]);

            const csvContent = [headers, ...rows]
                .map(row => row.join(','))
                .join('\n');

            await fs.writeFile(outputPath, csvContent);
            console.log(`Historial exportado a ${outputPath}`);

            return outputPath;
        } catch (error) {
            console.error('Error exportando a CSV:', error.message);
            throw error;
        }
    }

    /**
     * Limpiar historial antiguo
     */
    async cleanOldHistory(daysToKeep = 30) {
        try {
            const cutoffDate = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
            
            const data = await fs.readFile(this.historyFile, 'utf8');
            const history = JSON.parse(data);

            const originalCount = history.analyses.length;
            history.analyses = history.analyses.filter(a => a.timestamp > cutoffDate);
            
            const removedCount = originalCount - history.analyses.length;
            history.lastUpdated = Date.now();

            await fs.writeFile(this.historyFile, JSON.stringify(history, null, 2));
            
            console.log(`Limpiados ${removedCount} análisis antiguos`);
            
            return removedCount;
        } catch (error) {
            console.error('Error limpiando historial:', error.message);
            throw error;
        }
    }

    /**
     * Obtener sesión actual
     */
    getCurrentSession() {
        return this.currentSession;
    }

    /**
     * Verificar si hay sesión activa
     */
    hasActiveSession() {
        return this.currentSession !== null && this.currentSession.status === 'active';
    }
}

module.exports = new HistoryManager();