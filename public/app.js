// Configuración inicial
const socket = io();
let systemRunning = false;
let currentSessionId = null;
let sessionStartTime = null;
let sessionTimer = null;
let visualStream = null;
let providers = [];
let selectedProvider = null;

// Detección de dispositivo móvil
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

// Optimizaciones para móvil
if (isMobile) {
    // Deshabilitar zoom en inputs para evitar UX negativa
    document.addEventListener('touchstart', function(event) {
        if (event.touches.length > 1) {
            event.preventDefault();
        }
    }, { passive: false });
    
    // Prevenir scroll en elementos táctiles específicos
    const preventScrollElements = document.querySelectorAll('.config-panel, .results-section');
    preventScrollElements.forEach(el => {
        el.addEventListener('touchmove', function(e) {
            if (e.target.closest('.checkbox-group, .results-grid')) {
                e.preventDefault();
            }
        }, { passive: false });
    });
}

// Elementos del DOM
const elements = {
    // Estado
    statusDot: document.getElementById('statusDot'),
    statusText: document.getElementById('statusText'),
    
    // Configuración
    configPanel: document.getElementById('configPanel'),
    mainContent: document.getElementById('mainContent'),
    providerSelect: document.getElementById('providerSelect'),
    providerInfo: document.getElementById('providerInfo'),
    testProviderBtn: document.getElementById('testProviderBtn'),
    pairsCheckboxGroup: document.getElementById('pairsCheckboxGroup'),
    timeframesCheckboxGroup: document.getElementById('timeframesCheckboxGroup'),
    notificationInterval: document.getElementById('notificationInterval'),
    soundEnabled: document.getElementById('soundEnabled'),
    visualAlerts: document.getElementById('visualAlerts'),
    visualMode: document.getElementById('visualMode'),
    visualPreview: document.getElementById('visualPreview'),
    visualVideo: document.getElementById('visualVideo'),
    visualPlaceholder: document.getElementById('visualPlaceholder'),
    
    // Control
    startSystemBtn: document.getElementById('startSystemBtn'),
    stopSystemBtn: document.getElementById('stopSystemBtn'),
    
    // Visual principal
    mainVisualVideo: document.getElementById('mainVisualVideo'),
    mainVisualCanvas: document.getElementById('mainVisualCanvas'),
    visualOverlay: document.getElementById('visualOverlay'),
    currentVisualMode: document.getElementById('currentVisualMode'),
    visualConfidence: document.getElementById('visualConfidence'),
    visualStatus: document.getElementById('visualStatus'),
    
    // Sistema info
    currentProvider: document.getElementById('currentProvider'),
    currentTimeframes: document.getElementById('currentTimeframes'),
    currentNotificationInterval: document.getElementById('currentNotificationInterval'),
    
    // Resultados
    resultsGrid: document.getElementById('resultsGrid'),
    
    // Análisis detallado
    hierarchyGeneral: document.getElementById('hierarchyGeneral'),
    hierarchyDaily: document.getElementById('hierarchyDaily'),
    hierarchyIntermediate: document.getElementById('hierarchyIntermediate'),
    hierarchyCurrent: document.getElementById('hierarchyCurrent'),
    hierarchyImmediate: document.getElementById('hierarchyImmediate'),
    generalConsensus: document.getElementById('generalConsensus'),
    technicalGrid: document.getElementById('technicalGrid'),
    newsSentiment: document.getElementById('newsSentiment').querySelector('.sentiment-value'),
    newsList: document.getElementById('newsList'),
    visualResults: document.getElementById('visualResults'),
    historyList: document.getElementById('historyList'),
    
    // Estadísticas
    totalAnalyses: document.getElementById('totalAnalyses'),
    buySignals: document.getElementById('buySignals'),
    sellSignals: document.getElementById('sellSignals'),
    holdSignals: document.getElementById('holdSignals'),
    avgConfidence: document.getElementById('avgConfidence'),
    sessionDuration: document.getElementById('sessionDuration'),
    
    // Historial controles
    exportHistoryBtn: document.getElementById('exportHistoryBtn'),
    clearHistoryBtn: document.getElementById('clearHistoryBtn')
};

// Conexión WebSocket
socket.on('connect', () => {
    updateConnectionStatus(true);
    console.log('Conectado al servidor');
    loadProviders();
});

socket.on('disconnect', () => {
    updateConnectionStatus(false);
    console.log('Desconectado del servidor');
});

// Sistema integrado eventos
socket.on('integrated_system_started', (result) => {
    console.log('Sistema iniciado:', result);
    handleSystemStarted(result);
});

socket.on('integrated_system_stopped', (result) => {
    console.log('Sistema detenido:', result);
    handleSystemStopped(result);
});

socket.on('integrated_system_error', (error) => {
    console.error('Error del sistema:', error);
    showNotification('Error del sistema: ' + error.error, 'error');
});

// Análisis visual eventos
socket.on('visual_analysis_result', (result) => {
    console.log('Análisis visual completado:', result);
    updateVisualAnalysis(result);
});

socket.on('visual_analysis_error', (error) => {
    console.error('Error en análisis visual:', error);
});

// Estado del sistema
socket.on('system_status', (status) => {
    console.log('Estado del sistema:', status);
    updateSystemStatus(status);
});

// Funciones de inicialización
async function loadProviders() {
    try {
        const response = await fetch('/api/integrated/providers');
        const data = await response.json();
        
        if (data.success) {
            providers = data.data;
            populateProviderSelect(providers);
        }
    } catch (error) {
        console.error('Error cargando proveedores:', error);
    }
}

function populateProviderSelect(providers) {
    elements.providerSelect.innerHTML = '<option value="">Seleccionar proveedor...</option>';
    
    providers.forEach(provider => {
        const option = document.createElement('option');
        option.value = provider.id;
        option.textContent = `${provider.name} (${provider.type})`;
        elements.providerSelect.appendChild(option);
    });
}

// Event Listeners
elements.providerSelect.addEventListener('change', () => {
    const providerId = elements.providerSelect.value;
    selectedProvider = providers.find(p => p.id === providerId);
    
    if (selectedProvider) {
        updateProviderInfo(selectedProvider);
        elements.testProviderBtn.disabled = false;
    } else {
        clearProviderInfo();
        elements.testProviderBtn.disabled = true;
    }
});

elements.testProviderBtn.addEventListener('click', async () => {
    if (!selectedProvider) return;
    
    elements.testProviderBtn.disabled = true;
    elements.testProviderBtn.textContent = '🔄 Probando...';
    
    try {
        const response = await fetch(`/api/integrated/providers/${selectedProvider.id}/test`);
        const data = await response.json();
        
        if (data.success && data.connected) {
            showNotification(`Conexión exitosa con ${selectedProvider.name}`, 'success');
        } else {
            showNotification(`Error de conexión con ${selectedProvider.name}`, 'error');
        }
    } catch (error) {
        console.error('Error probando conexión:', error);
        showNotification('Error al probar conexión', 'error');
    } finally {
        elements.testProviderBtn.disabled = false;
        elements.testProviderBtn.textContent = '🧪 Probar Conexión';
    }
});

elements.visualMode.addEventListener('change', () => {
    const mode = elements.visualMode.value;
    
    if (mode === 'none') {
        stopVisualStream();
        elements.visualPlaceholder.style.display = 'block';
        elements.visualVideo.style.display = 'none';
    } else {
        startVisualStream(mode);
    }
});

elements.startSystemBtn.addEventListener('click', startSystem);
elements.stopSystemBtn.addEventListener('click', stopSystem);

// Tab navigation
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        btn.classList.add('active');
        const tabId = btn.getAttribute('data-tab') + '-tab';
        document.getElementById(tabId).classList.add('active');
    });
});

// Historial controles
elements.exportHistoryBtn.addEventListener('click', exportHistory);
elements.clearHistoryBtn.addEventListener('click', clearHistory);

// Funciones del sistema
async function startSystem() {
    try {
        const config = getSystemConfig();
        
        if (!config.apiProvider) {
            showNotification('Selecciona un proveedor de API', 'error');
            return;
        }
        
        if (config.pairs.length === 0) {
            showNotification('Selecciona al menos un par de divisas', 'error');
            return;
        }
        
        if (config.timeframes.length === 0) {
            showNotification('Selecciona al menos un timeframe', 'error');
            return;
        }
        
        elements.startSystemBtn.disabled = true;
        elements.startSystemBtn.textContent = '🔄 Iniciando...';
        
        socket.emit('start_integrated_system', config);
        
    } catch (error) {
        console.error('Error iniciando sistema:', error);
        showNotification('Error al iniciar sistema: ' + error.message, 'error');
        elements.startSystemBtn.disabled = false;
        elements.startSystemBtn.textContent = '🚀 INICIAR SISTEMA';
    }
}

function handleSystemStarted(result) {
    systemRunning = true;
    sessionStartTime = Date.now();
    
    // Actualizar UI
    elements.configPanel.style.display = 'none';
    elements.mainContent.style.display = 'block';
    elements.startSystemBtn.disabled = true;
    elements.stopSystemBtn.disabled = false;
    
    // Actualizar información del sistema
    updateSystemInfo(result.config);
    
    // Iniciar timer de sesión
    startSessionTimer();
    
    // Iniciar stream visual si está configurado
    if (result.config.visualMode !== 'none') {
        startMainVisualStream(result.config.visualMode);
    }
    
    showNotification('Sistema iniciado correctamente', 'success');
    
    // Solicitar primer análisis
    setTimeout(() => requestAnalysisUpdate(), 1000);
}

function stopSystem() {
    socket.emit('stop_integrated_system');
}

function handleSystemStopped(result) {
    systemRunning = false;
    
    // Detener timer
    stopSessionTimer();
    
    // Detener stream visual
    stopVisualStream();
    
    // Actualizar UI
    elements.configPanel.style.display = 'block';
    elements.mainContent.style.display = 'none';
    elements.startSystemBtn.disabled = false;
    elements.stopSystemBtn.disabled = true;
    elements.startSystemBtn.textContent = '🚀 INICIAR SISTEMA';
    
    showNotification('Sistema detenido correctamente', 'info');
}

function getSystemConfig() {
    const pairs = Array.from(elements.pairsCheckboxGroup.querySelectorAll('input:checked'))
        .map(input => input.value);
    
    const timeframes = Array.from(elements.timeframesCheckboxGroup.querySelectorAll('input:checked'))
        .map(input => input.value);
    
    return {
        apiProvider: elements.providerSelect.value,
        pairs: pairs,
        timeframes: timeframes,
        notificationInterval: parseInt(elements.notificationInterval.value),
        visualMode: elements.visualMode.value,
        notificationSound: elements.soundEnabled.checked,
        visualAlerts: elements.visualAlerts.checked
    };
}

function updateProviderInfo(provider) {
    elements.providerInfo.innerHTML = `
        <div class="provider-details">
            <p><strong>Tipo:</strong> ${provider.type}</p>
            <p><strong>Calidad:</strong> ${provider.dataQuality}</p>
            <p><strong>Tiempo Real:</strong> ${provider.realTime ? 'Sí' : 'No'}</p>
            <p><strong>Trading:</strong> ${provider.canTrade ? 'Sí' : 'No'}</p>
            <p><strong>Timeframes:</strong> ${provider.supportedTimeframes.join(', ')}</p>
            <p><strong>Pares:</strong> ${provider.supportedPairs.length} pares soportados</p>
        </div>
    `;
}

function clearProviderInfo() {
    elements.providerInfo.innerHTML = '<p class="info-placeholder">Selecciona un proveedor para ver detalles</p>';
}

function updateSystemInfo(config) {
    const provider = providers.find(p => p.id === config.apiProvider);
    elements.currentProvider.textContent = provider ? provider.name : '--';
    elements.currentTimeframes.textContent = config.timeframes.join(', ');
    elements.currentNotificationInterval.textContent = `Cada ${config.notificationInterval}s`;
    elements.currentVisualMode.textContent = config.visualMode === 'none' ? 'No activo' : config.visualMode;
}

function updateConnectionStatus(connected) {
    if (connected) {
        elements.statusDot.classList.add('connected');
        elements.statusDot.classList.remove('disconnected');
        elements.statusText.textContent = 'Conectado';
    } else {
        elements.statusDot.classList.remove('connected');
        elements.statusDot.classList.add('disconnected');
        elements.statusText.textContent = 'Desconectado';
    }
}

// Funciones de stream visual
async function startVisualStream(mode) {
    try {
        if (mode === 'camera') {
            visualStream = await navigator.mediaDevices.getUserMedia({ video: true });
        } else if (mode === 'screen') {
            visualStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        }
        
        elements.visualVideo.srcObject = visualStream;
        elements.visualPlaceholder.style.display = 'none';
        elements.visualVideo.style.display = 'block';
        
    } catch (error) {
        console.error('Error iniciando stream visual:', error);
        showNotification('Error al acceder a cámara/pantalla', 'error');
    }
}

async function startMainVisualStream(mode) {
    try {
        if (mode === 'camera') {
            visualStream = await navigator.mediaDevices.getUserMedia({ video: true });
        } else if (mode === 'screen') {
            visualStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        }
        
        elements.mainVisualVideo.srcObject = visualStream;
        elements.visualStatus.textContent = 'Activo';
        elements.currentVisualMode.textContent = mode;
        
        // Iniciar captura periódica para análisis
        startVisualCapture();
        
    } catch (error) {
        console.error('Error iniciando stream visual principal:', error);
        showNotification('Error al acceder a cámara/pantalla', 'error');
    }
}

function stopVisualStream() {
    if (visualStream) {
        visualStream.getTracks().forEach(track => track.stop());
        visualStream = null;
    }
    
    elements.visualVideo.srcObject = null;
    elements.mainVisualVideo.srcObject = null;
    elements.visualStatus.textContent = 'Inactivo';
    elements.currentVisualMode.textContent = '--';
}

let visualCaptureInterval = null;

function startVisualCapture() {
    if (visualCaptureInterval) {
        clearInterval(visualCaptureInterval);
    }
    
    // Capturar frame cada 5 segundos para análisis
    visualCaptureInterval = setInterval(() => {
        captureVisualFrame();
    }, 5000);
}

function stopVisualCapture() {
    if (visualCaptureInterval) {
        clearInterval(visualCaptureInterval);
        visualCaptureInterval = null;
    }
}

function captureVisualFrame() {
    if (!elements.mainVisualVideo || !elements.mainVisualCanvas) return;
    
    const canvas = elements.mainVisualCanvas;
    const video = elements.mainVisualVideo;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    
    // Convertir a blob y enviar al servidor
    canvas.toBlob(blob => {
        // En una implementación real, enviaríamos el blob al servidor
        // socket.emit('visual_input', blob);
        console.log('Frame capturado para análisis visual');
    }, 'image/jpeg', 0.8);
}

// Timer de sesión
function startSessionTimer() {
    if (sessionTimer) {
        clearInterval(sessionTimer);
    }
    
    sessionTimer = setInterval(() => {
        if (sessionStartTime) {
            const elapsed = Date.now() - sessionStartTime;
            elements.sessionDuration.textContent = formatDuration(elapsed);
        }
    }, 1000);
}

function stopSessionTimer() {
    if (sessionTimer) {
        clearInterval(sessionTimer);
        sessionTimer = null;
    }
}

function formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    const displaySeconds = seconds % 60;
    const displayMinutes = minutes % 60;
    const displayHours = hours;
    
    return `${String(displayHours).padStart(2, '0')}:${String(displayMinutes).padStart(2, '0')}:${String(displaySeconds).padStart(2, '0')}`;
}

// Solicitar actualización de análisis
function requestAnalysisUpdate() {
    if (!systemRunning) return;
    
    socket.emit('get_system_status');
}

// Actualizar estado del sistema
function updateSystemStatus(status) {
    if (status.isRunning && status.currentSession) {
        // Podríamos actualizar estadísticas aquí
        loadStatistics();
    }
}

// Cargar estadísticas
async function loadStatistics() {
    try {
        const response = await fetch('/api/integrated/statistics');
        const data = await response.json();
        
        if (data.success) {
            updateStatisticsDisplay(data.data);
        }
    } catch (error) {
        console.error('Error cargando estadísticas:', error);
    }
}

function updateStatisticsDisplay(stats) {
    elements.totalAnalyses.textContent = stats.totalAnalyses || 0;
    elements.buySignals.textContent = stats.signals?.buy || 0;
    elements.sellSignals.textContent = stats.signals?.sell || 0;
    elements.holdSignals.textContent = stats.signals?.hold || 0;
    elements.avgConfidence.textContent = (stats.avgConfidence * 100).toFixed(1) + '%';
}

// Análisis visual
function updateVisualAnalysis(result) {
    if (!result.visualAnalysis) return;
    
    elements.visualConfidence.textContent = (result.confidence * 100).toFixed(1) + '%';
    
    elements.visualResults.innerHTML = `
        <div class="visual-summary">
            <p><strong>Elementos Detectados:</strong></p>
            <ul>
                <li>Velas: ${result.visualAnalysis.elementsDetected.candles}</li>
                <li>Líneas de tendencia: ${result.visualAnalysis.elementsDetected.trendLines}</li>
                <li>Soportes/Resistencias: ${result.visualAnalysis.elementsDetected.supportResistance}</li>
                <li>Indicadores: ${result.visualAnalysis.elementsDetected.indicators}</li>
            </ul>
            <p><strong>Calidad de Datos:</strong> ${result.visualAnalysis.dataQuality.quality} (${(result.visualAnalysis.dataQuality.score * 100).toFixed(0)}%)</p>
            <p><strong>Sentimiento Visual:</strong> ${result.visualAnalysis.overallSentiment.sentiment} (${(result.visualAnalysis.overallSentiment.confidence * 100).toFixed(0)}%)</p>
        </div>
    `;
}

// Historial
async function exportHistory() {
    try {
        const response = await fetch('/api/integrated/export', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        const data = await response.json();
        
        if (data.success) {
            showNotification('Historial exportado correctamente', 'success');
        }
    } catch (error) {
        console.error('Error exportando historial:', error);
        showNotification('Error al exportar historial', 'error');
    }
}

async function clearHistory() {
    if (!confirm('¿Estás seguro de que quieres limpiar el historial?')) return;
    
    try {
        // Implementar limpieza de historial
        showNotification('Historial limpiado', 'info');
    } catch (error) {
        console.error('Error limpiando historial:', error);
        showNotification('Error al limpiar historial', 'error');
    }
}

// Notificaciones
function showNotification(message, type = 'info') {
    // Reproducir sonido personalizado
    playNotificationSound(type);
    
    // En móvil usar notificaciones nativas si están disponibles
    if (isMobile && 'Notification' in window && Notification.permission === 'granted') {
        new Notification('Exit Trading', {
            body: message,
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-96x96.png',
            vibrate: [200, 100, 200],
            sound: '/sounds/notification.mp3'
        });
        return;
    }
    
    const notification = document.createElement('div');
    notification.className = `notification-toast ${type}`;
    notification.textContent = message;
    
    // Optimizar para móvil
    const mobileStyles = isMobile ? {
        width: '90%',
        maxWidth: '400px',
        left: '5%',
        right: 'auto',
        fontSize: '16px',
        padding: '20px'
    } : {};
    
    notification.style.cssText = `
        position: fixed;
        top: ${isMobile ? 'auto' : '20px'};
        bottom: ${isMobile ? '20px' : 'auto'};
        ${isMobile ? 'left: 5%; right: 5%; width: 90%;' : 'right: 20px;'}
        padding: ${isMobile ? '20px' : '15px 20px'};
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        border-radius: ${isMobile ? '12px' : '5px'};
        z-index: 1000;
        animation: slideIn 0.3s ease;
        font-size: ${isMobile ? '16px' : '14px'};
        max-width: ${isMobile ? 'none' : '400px'};
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Función para reproducir sonido de notificación
function playNotificationSound(type) {
    try {
        const audio = new Audio('/sounds/notification.mp3');
        audio.volume = 0.5; // Volumen moderado
        
        // Preload el audio
        audio.load();
        
        // Reproducir con fallback
        const playPromise = audio.play();
        
        if (playPromise !== undefined) {
            playPromise
                .then(() => {
                    console.log('Sonido de notificación reproducido');
                })
                .catch(error => {
                    console.log('Error reproduciendo sonido:', error);
                    // Fallback a sonidos del sistema si falla
                    if (isMobile && 'vibrate' in navigator) {
                        navigator.vibrate([200, 100, 200]);
                    }
                });
        }
    } catch (error) {
        console.error('Error cargando audio:', error);
    }
}

// Cargar estado inicial
loadProviders();

// Optimizaciones de rendimiento para móvil
if (isMobile) {
    // Lazy loading de componentes pesados
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Cargar contenido cuando sea visible
                entry.target.classList.add('loaded');
            }
        });
    }, observerOptions);
    
    // Observar elementos que pueden cargarse perezosamente
    document.querySelectorAll('.results-section, .detailed-analysis').forEach(el => {
        observer.observe(el);
    });
    
    // Reducir frecuencia de actualizaciones en móvil para ahorrar batería
    const originalUpdateFrequency = 1000; // 1 segundo
    const mobileUpdateFrequency = 5000; // 5 segundos en móvil
    
    // Ajustar intervalos según dispositivo
    const updateFrequency = isMobile ? mobileUpdateFrequency : originalUpdateFrequency;
    
    // Implementar debouncing para eventos táctiles
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    // Aplicar debouncing a eventos frecuentes
    const debouncedUpdateStats = debounce(updateStatisticsDisplay, 2000);
    
    // Reemplazar updateStatisticsDisplay con versión debounced en móvil
    if (isMobile) {
        window.updateStatisticsDisplay = debouncedUpdateStats;
    }
    
    // Optimizar scroll performance
    let ticking = false;
    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                // Lógica de scroll optimizada
                ticking = false;
            });
            ticking = true;
        }
    });
}

// Detectar conexión online/offline
window.addEventListener('online', () => {
    showNotification('Conexión restaurada', 'success');
    // Recargar datos si es necesario
    if (systemRunning) {
        loadProviders();
    }
});

window.addEventListener('offline', () => {
    showNotification('Modo offline activado', 'warning');
    // Informar al usuario que algunas funciones pueden estar limitadas
});

// PWA install prompt
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    // Mostrar botón de instalación (podrías implementar esto en la UI)
    console.log('PWA install prompt disponible');
    
    // Auto-instalar en móvil si es apropiado
    if (isMobile && !localStorage.getItem('pwa-install-dismissed')) {
        // Podrías mostrar un banner de instalación
    }
});

// Manejar instalación de PWA
window.addEventListener('appinstalled', () => {
    console.log('PWA instalada exitosamente');
    localStorage.setItem('pwa-installed', 'true');
    showNotification('¡App instalada exitosamente!', 'success');
});