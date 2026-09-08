class NotificationService {
    constructor() {
        this.subscribers = new Map();
        this.notificationHistory = [];
        this.maxHistorySize = 100;
        this.config = {
            intervals: [5, 10, 20, 30, 60], // segundos
            active: true,
            sound: true,
            visual: true
        };
    }

    // Configurar intervalos de notificación
    setIntervals(intervals) {
        this.config.intervals = intervals;
        console.log('Intervalos de notificación actualizados:', intervals);
    }

    // Activar/desactivar notificaciones
    setActive(active) {
        this.config.active = active;
        console.log('Notificaciones:', active ? 'activadas' : 'desactivadas');
    }

    // Suscribir cliente a notificaciones
    subscribe(clientId, socket) {
        this.subscribers.set(clientId, {
            socket,
            subscribedAt: Date.now(),
            preferences: {
                pairs: [],
                intervals: [...this.config.intervals]
            }
        });
        console.log(`Cliente ${clientId} suscrito a notificaciones`);
    }

    // Desuscribir cliente
    unsubscribe(clientId) {
        this.subscribers.delete(clientId);
        console.log(`Cliente ${clientId} desuscrito`);
    }

    // Actualizar preferencias del cliente
    updatePreferences(clientId, preferences) {
        const client = this.subscribers.get(clientId);
        if (client) {
            client.preferences = { ...client.preferences, ...preferences };
            console.log(`Preferencias actualizadas para cliente ${clientId}:`, preferences);
        }
    }

    // Enviar notificación a todos los suscriptores
    async notifyAll(decision) {
        if (!this.config.active) return;

        const notification = this.createNotification(decision);
        this.addToHistory(notification);

        for (const [clientId, client] of this.subscribers) {
            try {
                if (this.shouldNotify(client, decision)) {
                    client.socket.emit('trading_signal', notification);
                    console.log(`Notificación enviada a cliente ${clientId}`);
                }
            } catch (error) {
                console.error(`Error enviando notificación a ${clientId}:`, error.message);
            }
        }
    }

    // Enviar notificación a cliente específico
    async notifyClient(clientId, decision) {
        if (!this.config.active) return;

        const client = this.subscribers.get(clientId);
        if (!client) return;

        if (this.shouldNotify(client, decision)) {
            const notification = this.createNotification(decision);
            client.socket.emit('trading_signal', notification);
            this.addToHistory(notification);
            console.log(`Notificación enviada a cliente ${clientId}`);
        }
    }

    // Determinar si se debe notificar a este cliente
    shouldNotify(client, decision) {
        const preferences = client.preferences;
        
        // Verificar si el par está en la lista de preferencias
        if (preferences.pairs.length > 0 && !preferences.pairs.includes(decision.pair)) {
            return false;
        }

        // Verificar si la decisión es accionable
        if (!decision.actionable) {
            return false;
        }

        // Verificar confianza mínima
        if (decision.confidence < 0.6) {
            return false;
        }

        return true;
    }

    // Crear notificación formateada
    createNotification(decision) {
        return {
            id: this.generateId(),
            timestamp: Date.now(),
            pair: decision.pair,
            timeframe: decision.timeframe,
            action: decision.decision.action,
            confidence: decision.decision.confidence,
            currentPrice: decision.decision.currentPrice,
            support: decision.decision.support,
            resistance: decision.decision.resistance,
            riskLevel: decision.decision.riskLevel,
            reasons: decision.decision.reasons,
            urgency: this.calculateUrgency(decision),
            analysis: {
                technical: decision.analysis.technical.candlestick.overallSentiment,
                news: decision.analysis.news.sentiment,
                algorithmic: decision.analysis.algorithmic.recommendation
            }
        };
    }

    // Calcular urgencia de la notificación
    calculateUrgency(decision) {
        const confidence = decision.decision.confidence;
        const riskLevel = decision.decision.riskLevel;

        if (confidence > 0.8 && riskLevel === 'high') {
            return 'critical';
        } else if (confidence > 0.7) {
            return 'high';
        } else if (confidence > 0.6) {
            return 'medium';
        } else {
            return 'low';
        }
    }

    // Generar ID único
    generateId() {
        return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Añadir al historial
    addToHistory(notification) {
        this.notificationHistory.unshift(notification);
        if (this.notificationHistory.length > this.maxHistorySize) {
            this.notificationHistory.pop();
        }
    }

    // Obtener historial de notificaciones
    getHistory(limit = 20) {
        return this.notificationHistory.slice(0, limit);
    }

    // Obtener estadísticas de notificaciones
    getStatistics() {
        const stats = {
            total: this.notificationHistory.length,
            byAction: { buy: 0, sell: 0, hold: 0 },
            byUrgency: { critical: 0, high: 0, medium: 0, low: 0 },
            byPair: {},
            avgConfidence: 0
        };

        if (this.notificationHistory.length === 0) return stats;

        let totalConfidence = 0;

        this.notificationHistory.forEach(notif => {
            stats.byAction[notif.action]++;
            stats.byUrgency[notif.urgency]++;
            
            if (!stats.byPair[notif.pair]) {
                stats.byPair[notif.pair] = 0;
            }
            stats.byPair[notif.pair]++;
            
            totalConfidence += notif.confidence;
        });

        stats.avgConfidence = totalConfidence / this.notificationHistory.length;

        return stats;
    }

    // Sistema de alertas programadas
    async scheduleAlert(pair, interval, callback) {
        const intervalId = setInterval(async () => {
            try {
                await callback(pair);
            } catch (error) {
                console.error(`Error en alerta programada para ${pair}:`, error.message);
            }
        }, interval * 1000);

        return intervalId;
    }

    // Cancelar alerta programada
    cancelAlert(intervalId) {
        clearInterval(intervalId);
    }

    // Notificaciones de sonido (implementación básica)
    playSound(type = 'default') {
        if (!this.config.sound) return;

        // En una implementación real, esto reproduciría un sonido
        console.log(`🔊 Sonido de notificación: ${type}`);
    }

    // Notificaciones visuales
    showVisualAlert(notification) {
        if (!this.config.visual) return;

        // En una implementación real, esto mostraría una alerta visual
        console.log(`🔔 Alerta visual: ${notification.action.toUpperCase()} ${notification.pair}`);
    }
}

module.exports = new NotificationService();