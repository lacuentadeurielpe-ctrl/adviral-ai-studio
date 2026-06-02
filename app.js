// AdViral AI Studio - Core Application Logic

// State Management
const state = {
    connectionMode: 'proxy', // 'direct' or 'proxy'
    apiKeys: {
        anthropic: '',
        deepseek: ''
    },
    supabase: {
        url: 'https://gvhjvvcmtuttacxlsyip.supabase.co',
        key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2aGp2dmNtdHV0dGFjeGxzeWlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5ODc4MjEsImV4cCI6MjA5NTU2MzgyMX0.DcTQde81lBSL6KHn_wUnlpLESwMi0GwH3nxvkvn9ESI'
    },
    anthropicModel: 'claude-3-5-sonnet-20241022',
    deepseekModel: 'deepseek-chat',
    contentType: 'ad', // 'ad' or 'viral'
    selectedTone: 'Enérgico / UGC',
    customTone: '',
    uploadedImages: [], // array of { name: string, base64: string }
    activeAgent: 0, // 0 = idle, 1, 2, 3
    logs: [],
    currentProject: null,
    savedProjects: []
};

// Abort Controller for Pausing/Stopping Generation Bot
let abortController = null;
let simulationTimeouts = [];

// DOM Elements
const elements = {
    // Nav & Config
    apiConfigBtn: document.getElementById('api-config-btn'),
    apiStatusText: document.getElementById('api-status-text'),
    apiModal: document.getElementById('api-modal'),
    apiCancelBtn: document.getElementById('api-cancel-btn'),
    apiSaveBtn: document.getElementById('api-save-btn'),
    selectConnectionMode: document.getElementById('select-connection-mode'),
    apiKeyAnthropic: document.getElementById('api-key-anthropic'),
    apiKeyDeepSeek: document.getElementById('api-key-deepseek'),
    selectAnthropicModel: document.getElementById('select-anthropic-model'),
    selectDeepSeekModel: document.getElementById('select-deepseek-model'),
    testAnthropicBtn: document.getElementById('test-anthropic-btn'),
    testDeepSeekBtn: document.getElementById('test-deepseek-btn'),
    apiSupabaseUrl: document.getElementById('api-supabase-url'),
    apiSupabaseKey: document.getElementById('api-supabase-key'),
    
    // Tabs
    tabGenerator: document.getElementById('tab-generator'),
    tabGallery: document.getElementById('tab-gallery'),
    generatorView: document.getElementById('generator-view'),
    studioView: document.getElementById('studio-view'),
    galleryView: document.getElementById('gallery-view'),
    
    // Input Fields
    typeAd: document.getElementById('type-ad'),
    typeViral: document.getElementById('type-viral'),
    inputProduct: document.getElementById('input-product'),
    inputBrief: document.getElementById('input-brief'),
    toneChipsContainer: document.getElementById('tone-chips-container'),
    inputToneCustom: document.getElementById('input-tone-custom'),
    dropZone: document.getElementById('drop-zone'),
    fileInput: document.getElementById('file-input'),
    previewContainer: document.getElementById('preview-container'),
    generateBtn: document.getElementById('generate-btn'),
    
    // Agent Timeline
    agent1Node: document.getElementById('agent-1-node'),
    agent2Node: document.getElementById('agent-2-node'),
    agent3Node: document.getElementById('agent-3-node'),
    statusAgent1: document.getElementById('status-agent-1'),
    statusAgent2: document.getElementById('status-agent-2'),
    statusAgent3: document.getElementById('status-agent-3'),
    spinnerAgent1: document.getElementById('spinner-agent-1'),
    spinnerAgent2: document.getElementById('spinner-agent-2'),
    spinnerAgent3: document.getElementById('spinner-agent-3'),
    logTerminal: document.getElementById('log-terminal'),
    clearLogsBtn: document.getElementById('clear-logs-btn'),
    
    // Studio Outputs
    blueprintContent: document.getElementById('blueprint-content'),
    blueprintImagesContainer: document.getElementById('blueprint-images-container'),
    fullAudioContent: document.getElementById('full-audio-content'),
    storyboardContainer: document.getElementById('storyboard-container'),
    backToInputBtn: document.getElementById('back-to-input-btn'),
    exportPdfBtn: document.getElementById('export-pdf-btn'),
    copyFullAudioBtn: document.getElementById('copy-full-audio-btn'),
    copyAllPromptsBtn: document.getElementById('copy-all-prompts-btn'),
    toggleRefProduct: document.getElementById('toggle-ref-product'),
    toggleRefCharacter: document.getElementById('toggle-ref-character'),
    
    // Gallery
    galleryGrid: document.getElementById('gallery-grid'),
    galleryEmptyState: document.getElementById('gallery-empty-state'),
    clearGalleryBtn: document.getElementById('clear-gallery-btn'),
    
    // Toast
    toast: document.getElementById('alert-toast'),
    toastText: document.getElementById('alert-toast-text')
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    loadHistory();
    setupEventListeners();
    renderToneChips();
    logToTerminal('AdViral AI Studio inicializado. Selecciona tu tipo de contenido y añade la descripción del producto.', 'info');
});

// Load Settings from LocalStorage
function loadSettings() {
    const keys = localStorage.getItem('adviral_api_keys');
    if (keys) {
        state.apiKeys = JSON.parse(keys);
        elements.apiKeyAnthropic.value = state.apiKeys.anthropic || '';
        elements.apiKeyDeepSeek.value = state.apiKeys.deepseek || '';
    }

    const sb = localStorage.getItem('adviral_supabase');
    if (sb) {
        state.supabase = JSON.parse(sb);
    }
    // Set elements value (will fall back to default hardcoded credentials in state)
    elements.apiSupabaseUrl.value = state.supabase.url || '';
    elements.apiSupabaseKey.value = state.supabase.key || '';
    
    const mode = localStorage.getItem('adviral_conn_mode');
    if (mode) {
        state.connectionMode = mode;
        elements.selectConnectionMode.value = mode;
    }

    const antModel = localStorage.getItem('adviral_ant_model');
    if (antModel && elements.selectAnthropicModel) {
        if (antModel === 'claude-3-5-sonnet-latest') {
            state.anthropicModel = 'claude-3-5-sonnet-20241022';
            elements.selectAnthropicModel.value = 'claude-3-5-sonnet-20241022';
            localStorage.setItem('adviral_ant_model', 'claude-3-5-sonnet-20241022');
        } else {
            state.anthropicModel = antModel;
            elements.selectAnthropicModel.value = antModel;
        }
    }

    const dsModel = localStorage.getItem('adviral_ds_model');
    if (dsModel && elements.selectDeepSeekModel) {
        state.deepseekModel = dsModel;
        elements.selectDeepSeekModel.value = dsModel;
    }
    
    updateAPIStatusBadge();
}

// Save Settings to LocalStorage
function saveSettings() {
    state.connectionMode = elements.selectConnectionMode.value;
    state.apiKeys.anthropic = elements.apiKeyAnthropic.value.trim();
    state.apiKeys.deepseek = elements.apiKeyDeepSeek.value.trim();
    
    state.supabase.url = elements.apiSupabaseUrl.value.trim();
    state.supabase.key = elements.apiSupabaseKey.value.trim();
    
    if (elements.selectAnthropicModel) {
        state.anthropicModel = elements.selectAnthropicModel.value;
        localStorage.setItem('adviral_ant_model', state.anthropicModel);
    }
    if (elements.selectDeepSeekModel) {
        state.deepseekModel = elements.selectDeepSeekModel.value;
        localStorage.setItem('adviral_ds_model', state.deepseekModel);
    }
    
    localStorage.setItem('adviral_api_keys', JSON.stringify(state.apiKeys));
    localStorage.setItem('adviral_supabase', JSON.stringify(state.supabase));
    localStorage.setItem('adviral_conn_mode', state.connectionMode);
    
    updateAPIStatusBadge();
    
    // Reload history if Supabase settings changed
    loadHistory();
    
    showToast('Configuración guardada correctamente.');
    closeModal();
}

// Update API config status button
function updateAPIStatusBadge() {
    const isVercel = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
    const hasAnthropic = !!state.apiKeys.anthropic || (isVercel && state.connectionMode === 'proxy');
    const hasDeepSeek = !!state.apiKeys.deepseek || (isVercel && state.connectionMode === 'proxy');
    
    if (hasAnthropic && hasDeepSeek) {
        elements.apiConfigBtn.style.borderColor = 'var(--success)';
        elements.apiConfigBtn.style.color = '#34d399';
        elements.apiConfigBtn.style.background = 'rgba(16, 185, 129, 0.1)';
        elements.apiStatusText.textContent = isVercel && !state.apiKeys.anthropic ? 'APIs Vercel Activas' : 'APIs Conectadas';
    } else {
        elements.apiConfigBtn.style.borderColor = 'var(--warning)';
        elements.apiConfigBtn.style.color = 'var(--warning)';
        elements.apiConfigBtn.style.background = 'rgba(245, 158, 11, 0.1)';
        elements.apiStatusText.textContent = 'Simulando (Sin APIs)';
    }
}

// Supabase REST Client
async function callSupabase(method, path, body = null) {
    if (!state.supabase.url || !state.supabase.key) return null;
    
    const baseUrl = state.supabase.url.replace(/\/$/, "");
    const url = `${baseUrl}/rest/v1/${path}`;
    
    const headers = {
        'apikey': state.supabase.key,
        'Authorization': `Bearer ${state.supabase.key}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
    };
    
    const options = {
        method: method,
        headers: headers
    };
    
    if (body) {
        options.body = JSON.stringify(body);
    }
    
    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            const text = await response.text();
            throw new Error(`Supabase error (${response.status}): ${text}`);
        }
        return await response.json();
    } catch (err) {
        console.error("Supabase request failed:", err);
        throw err;
    }
}

// Load History from Supabase (LocalStorage is removed for project history)
async function loadHistory() {
    const hasSupabase = !!state.supabase.url && !!state.supabase.key;
    
    if (hasSupabase) {
        logToTerminal('[Base de Datos] Cargando historial desde Supabase...', 'info');
        try {
            const data = await callSupabase('GET', 'projects?select=*&order=id.desc');
            if (data && Array.isArray(data)) {
                state.savedProjects = data.map(item => ({
                    id: item.id,
                    timestamp: item.timestamp || new Date(item.created_at).toLocaleString(),
                    product: item.product,
                    brief: item.brief,
                    tone: item.tone,
                    images: Array.isArray(item.images) ? item.images : (item.images ? JSON.parse(item.images) : []),
                    project: typeof item.project === 'string' ? JSON.parse(item.project) : item.project
                }));
                logToTerminal(`[Base de Datos] ${state.savedProjects.length} proyectos cargados desde Supabase.`, 'success');
            } else {
                state.savedProjects = [];
            }
        } catch (err) {
            logToTerminal(`[Base de Datos] [ERROR] Falló al cargar de Supabase: ${err.message}.`, 'warning');
            state.savedProjects = [];
        }
    } else {
        logToTerminal('[Base de Datos] Supabase no está configurado. El historial de proyectos no estará disponible.', 'warning');
        state.savedProjects = [];
    }
    renderGallery();
}

// Setup Event Listeners
function setupEventListeners() {
    // API Modal Controls
    elements.apiConfigBtn.addEventListener('click', () => {
        if (state.activeAgent > 0) {
            showToast('No puedes configurar las APIs durante la generación.', true);
            return;
        }
        openModal();
    });
    elements.apiCancelBtn.addEventListener('click', closeModal);
    elements.apiSaveBtn.addEventListener('click', saveSettings);
    
    // Toggle Password Visibility
    document.querySelectorAll('.toggle-password').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const input = btn.previousElementSibling;
            if (input.type === 'password') {
                input.type = 'text';
                btn.innerHTML = '<i class="fa-solid fa-eye-slash"></i>';
            } else {
                input.type = 'password';
                btn.innerHTML = '<i class="fa-solid fa-eye"></i>';
            }
        });
    });

    // Views Tabs Navigation
    elements.tabGenerator.addEventListener('click', () => switchView('generator'));
    elements.tabGallery.addEventListener('click', () => switchView('gallery'));
    elements.backToInputBtn.addEventListener('click', () => switchView('generator'));
    elements.exportPdfBtn.addEventListener('click', exportProjectToPDF);
    
    // Connection Mode Change
    elements.selectConnectionMode.addEventListener('change', (e) => {
        const warning = document.getElementById('proxy-warning-msg');
        if (e.target.value === 'direct') {
            warning.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> Las llamadas directas pueden fallar por CORS. Asegúrate de tener activa una extensión de CORS o usa el Proxy Local.';
            warning.style.color = '#ef4444';
        } else {
            warning.innerHTML = '<i class="fa-solid fa-circle-info"></i> Modo recomendado. Abre PowerShell en este directorio y ejecuta <code>.\\run-proxy.ps1</code>.';
            warning.style.color = 'var(--warning)';
        }
    });

    // Content Type Selection
    elements.typeAd.addEventListener('click', () => selectContentType('ad'));
    elements.typeViral.addEventListener('click', () => selectContentType('viral'));

    // Image Upload / Drag and Drop
    elements.dropZone.addEventListener('click', () => elements.fileInput.click());
    elements.fileInput.addEventListener('change', handleFileSelect);
    
    elements.dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        elements.dropZone.style.borderColor = 'var(--secondary)';
        elements.dropZone.style.background = 'rgba(6, 182, 212, 0.05)';
    });
    
    elements.dropZone.addEventListener('dragleave', () => {
        elements.dropZone.style.borderColor = 'rgba(255, 255, 255, 0.12)';
        elements.dropZone.style.background = 'rgba(15, 23, 42, 0.2)';
    });
    
    elements.dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        elements.dropZone.style.borderColor = 'rgba(255, 255, 255, 0.12)';
        elements.dropZone.style.background = 'rgba(15, 23, 42, 0.2)';
        if (e.dataTransfer.files.length > 0) {
            processFiles(e.dataTransfer.files);
        }
    });

    // Clear Logs
    elements.clearLogsBtn.addEventListener('click', () => {
        elements.logTerminal.innerHTML = '';
        logToTerminal('Consola limpia.', 'info');
    });

    // Copy Results
    elements.copyFullAudioBtn.addEventListener('click', () => {
        copyToClipboard(state.currentProject.fullDialogue);
        showToast('Guión de audio copiado');
    });
    
    elements.copyAllPromptsBtn.addEventListener('click', () => {
        if (!state.currentProject || !state.currentProject.scenes) return;
        const allPrompts = state.currentProject.scenes.map(s => {
            const rawPrompt = s.veoPrompt || s.veoPromptTextOnly || s.veo_prompt || '';
            const processedPrompt = processPromptWithRefToggles(rawPrompt);
            return `[Escena ${s.number}] - ${processedPrompt}`;
        }).join('\n\n');
        copyToClipboard(allPrompts);
        showToast('Todos los prompts copiados');
    });

    if (elements.toggleRefProduct) {
        elements.toggleRefProduct.addEventListener('change', () => {
            renderStudioView();
            logToTerminal(`[STUDIO] Vista de prompts actualizada: Usar referencia de producto = ${elements.toggleRefProduct.checked ? 'SÍ' : 'NO'}`, 'info');
        });
    }
    if (elements.toggleRefCharacter) {
        elements.toggleRefCharacter.addEventListener('change', () => {
            renderStudioView();
            logToTerminal(`[STUDIO] Vista de prompts actualizada: Usar referencia de personaje = ${elements.toggleRefCharacter.checked ? 'SÍ' : 'NO'}`, 'info');
        });
    }

    // Generate Button
    elements.generateBtn.addEventListener('click', startGenerationPipeline);

    // Gallery Actions
    elements.clearGalleryBtn.addEventListener('click', clearGallery);

    // Test Connections
    if (elements.testAnthropicBtn) {
        elements.testAnthropicBtn.addEventListener('click', testAnthropicConnection);
    }
    if (elements.testDeepSeekBtn) {
        elements.testDeepSeekBtn.addEventListener('click', testDeepSeekConnection);
    }
}

// Modal open/close
function openModal() {
    elements.apiModal.classList.add('active');
}
function closeModal() {
    elements.apiModal.classList.remove('active');
}

// Switch Views
function switchView(viewName) {
    if (state.activeAgent > 0 && viewName !== 'generator') {
        showToast('Generación en curso. Detén el bot antes de cambiar de vista.', true);
        return;
    }
    
    elements.tabGenerator.classList.remove('active');
    elements.tabGallery.classList.remove('active');
    elements.generatorView.classList.add('hidden');
    elements.studioView.classList.add('hidden');
    elements.galleryView.classList.add('hidden');

    if (viewName === 'generator') {
        elements.tabGenerator.classList.add('active');
        elements.generatorView.classList.remove('hidden');
    } else if (viewName === 'gallery') {
        elements.tabGallery.classList.add('active');
        elements.galleryView.classList.remove('hidden');
        renderGallery();
    } else if (viewName === 'studio') {
        elements.studioView.classList.remove('hidden');
    }
}

// Select Content Type (Ad vs. Viral)
function selectContentType(type) {
    state.contentType = type;
    if (type === 'ad') {
        elements.typeAd.classList.add('active');
        elements.typeViral.classList.remove('active');
        elements.inputProduct.placeholder = "Ej: Termo inteligente de acero inoxidable con pantalla LED de temperatura. Se dirige a profesionales jóvenes de 25-40 años que van al gimnasio y trabajan en oficinas corporativas...";
        elements.inputBrief.placeholder = "Ej: Un video estilo UGC dinámico mostrando la frustración de tomar café frío, y luego el alivio de ver la temperatura exacta en el termo con un hook impactante en los primeros 3 segundos. Estructura TikTok.";
    } else {
        elements.typeAd.classList.remove('active');
        elements.typeViral.classList.add('active');
        elements.inputProduct.placeholder = "Ej: Marca de moda streetwear sostenible (poleras de algodón orgánico oversize). Se dirige a la Generación Z y Millennials (16-30 años), amantes del skate, el arte urbano y festivales de música...";
        elements.inputBrief.placeholder = "Ej: Un video de transiciones rápidas mostrando 3 formas de combinar una polera negra oversize para salir de noche, usando música de tendencia de fondo y texto grande dinámico en pantalla.";
    }
}

// Handle Brand Tone Selection
function renderToneChips() {
    elements.toneChipsContainer.innerHTML = '';
    const tones = [
        'Enérgico / UGC',
        'Premium / Elegante',
        'Humorístico / Irónico',
        'Cinematográfico',
        'Inspiracional / Storytelling',
        'Venta Directa',
        'Otro (Personalizado)'
    ];

    tones.forEach(tone => {
        const chip = document.createElement('span');
        chip.className = `tone-chip ${state.selectedTone === tone ? 'active' : ''}`;
        chip.textContent = tone;
        chip.addEventListener('click', () => {
            document.querySelectorAll('.tone-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            state.selectedTone = tone;
            
            if (tone === 'Otro (Personalizado)') {
                elements.inputToneCustom.classList.remove('hidden');
                elements.inputToneCustom.focus();
            } else {
                elements.inputToneCustom.classList.add('hidden');
            }
        });
        elements.toneChipsContainer.appendChild(chip);
    });
}

// File Selection & Base64 conversions
function handleFileSelect(e) {
    if (e.target.files.length > 0) {
        processFiles(e.target.files);
    }
}

async function processFiles(files) {
    const promises = Array.from(files).map(async (file) => {
        if (!file.type.startsWith('image/')) {
            logToTerminal(`Archivo rechazado: ${file.name} no es una imagen.`, 'warning');
            return;
        }
        
        const base64Data = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsDataURL(file);
        });
        
        logToTerminal(`Optimizando imagen: ${file.name}...`, 'info');
        const optimizedBase64 = await compressImageAsync(base64Data, 1024, 1024, 0.75);
        
        state.uploadedImages.push({
            name: file.name,
            base64: optimizedBase64
        });
        logToTerminal(`Imagen cargada y optimizada: ${file.name}`, 'info');
    });
    
    await Promise.all(promises);
    renderPreviews();
}

function renderPreviews() {
    elements.previewContainer.innerHTML = '';
    state.uploadedImages.forEach((img, index) => {
        const item = document.createElement('div');
        item.className = 'preview-item';
        item.innerHTML = `
            <img src="${img.base64}" alt="${img.name}">
            <button class="preview-remove" data-index="${index}">&times;</button>
        `;
        
        item.querySelector('.preview-remove').addEventListener('click', (e) => {
            e.stopPropagation();
            const idx = parseInt(e.target.getAttribute('data-index'));
            state.uploadedImages.splice(idx, 1);
            renderPreviews();
            logToTerminal(`Imagen eliminada.`, 'info');
        });
        
        elements.previewContainer.appendChild(item);
    });
}

// Toast Logger Utility
function logToTerminal(message, type = 'info') {
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    const timestamp = new Date().toLocaleTimeString();
    entry.innerHTML = `<span style="color: var(--text-muted)">[${timestamp}]</span> ${message}`;
    elements.logTerminal.appendChild(entry);
    elements.logTerminal.scrollTop = elements.logTerminal.scrollHeight;
}

function showToast(text, isError = false) {
    elements.toastText.textContent = text;
    if (isError) {
        elements.toast.classList.add('error');
    } else {
        elements.toast.classList.remove('error');
    }
    elements.toast.classList.add('show');
    setTimeout(() => {
        elements.toast.classList.remove('show');
    }, 3000);
}

function copyToClipboard(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
}

// Export script and storyboard as PDF using html2pdf.js
function exportProjectToPDF() {
    if (!state.currentProject) {
        showToast('No hay ningún proyecto activo para exportar.', true);
        return;
    }
    
    showToast('Generando PDF...');
    
    // Target the entire production studio container
    const element = document.querySelector('.studio-container');
    
    // Add print class
    element.classList.add('exporting-pdf');
    
    // html2pdf options
    const opt = {
        margin: [12, 12, 12, 12],
        filename: `adviral_campaña_${Date.now()}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
            scale: 2, 
            useCORS: true, 
            backgroundColor: '#0f172a', // Cyber dark background
            logging: false,
            allowTaint: true
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    html2pdf().set(opt).from(element).save()
        .then(() => {
            element.classList.remove('exporting-pdf');
            showToast('PDF descargado con éxito.');
        })
        .catch(err => {
            element.classList.remove('exporting-pdf');
            console.error("PDF generation failed:", err);
            showToast('Error al generar PDF.', true);
        });
}

// Helper to route proxy calls dynamically between Local PowerShell Proxy and Vercel Serverless Functions
function getProxyUrl(endpoint) {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return `http://localhost:3000${endpoint}`;
    }
    return endpoint;
}

// API Connection wrapper (supports Direct & Local Proxy)
async function callLLM(provider, payload) {
    let url = '';
    const headers = {
        'Content-Type': 'application/json'
    };
    
    if (state.connectionMode === 'proxy') {
        url = getProxyUrl(`/api/${provider}`);
        // In proxy mode, we pass the API keys in headers so the proxy can append them
        headers['x-anthropic-key'] = state.apiKeys.anthropic;
        headers['x-deepseek-key'] = state.apiKeys.deepseek;
    } else {
        // Direct Mode
        if (provider === 'anthropic') {
            url = 'https://api.anthropic.com/v1/messages';
            headers['x-api-key'] = state.apiKeys.anthropic;
            headers['anthropic-version'] = '2023-06-01';
            headers['anthropic-dangerous-by-pass-browser-validation'] = 'true';
        } else {
            url = 'https://api.deepseek.com/chat/completions';
            headers['Authorization'] = `Bearer ${state.apiKeys.deepseek}`;
        }
    }
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(payload),
            signal: abortController ? abortController.signal : null
        });
        
        if (!response.ok) {
            const errData = await response.text();
            throw new Error(`API Error (${response.status}): ${errData}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error(error);
        throw error;
    }
}

// Helper: Compress Base64 Image to lightweight thumbnail (Max 250px) to prevent LocalStorage QuotaExceededError
function compressImageAsync(base64Str, maxWidth = 250, maxHeight = 250, quality = 0.6) {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = base64Str;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            
            if (width > height) {
                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }
            } else {
                if (height > maxHeight) {
                    width = Math.round((width * maxHeight) / height);
                    height = maxHeight;
                }
            }
            
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            // Export as JPEG with configured quality (default 0.6)
            resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = () => {
            resolve(base64Str); // Fallback to original
        };
    });
}


function setInputState(disabled) {
    elements.inputProduct.disabled = disabled;
    elements.inputBrief.disabled = disabled;
    elements.fileInput.disabled = disabled;
    elements.typeAd.disabled = disabled;
    elements.typeViral.disabled = disabled;
    
    // Disable tone chips container pointer events and dim opacity
    if (elements.toneChipsContainer) {
        if (disabled) {
            elements.toneChipsContainer.style.pointerEvents = 'none';
            elements.toneChipsContainer.style.opacity = '0.5';
        } else {
            elements.toneChipsContainer.style.pointerEvents = 'auto';
            elements.toneChipsContainer.style.opacity = '1';
        }
    }
    
    if (elements.dropZone) {
        if (disabled) {
            elements.dropZone.style.pointerEvents = 'none';
            elements.dropZone.style.opacity = '0.5';
        } else {
            elements.dropZone.style.pointerEvents = 'auto';
            elements.dropZone.style.opacity = '1';
        }
    }
}

function resetGenerationUI() {
    state.activeAgent = 0;
    elements.generateBtn.className = "btn btn-primary";
    elements.generateBtn.innerHTML = '<i class="fa-solid fa-play"></i> Generar Guión & Prompts Pro';
    elements.generateBtn.disabled = false;
    abortController = null;
    setInputState(false);
}

function abortGeneration() {
    if (abortController) {
        abortController.abort();
    }
    // Clear simulation timeouts
    simulationTimeouts.forEach(clearTimeout);
    simulationTimeouts = [];
    
    resetAgentNodes();
    resetGenerationUI();
    logToTerminal('[SISTEMA] Pipeline detenido. Bot en pausa.', 'warning');
    showToast('Generación cancelada.');
}

// MULTI-AGENT EXECUTION FLOW
async function startGenerationPipeline() {
    // If already generating, act as a Cancel/Pause button
    if (state.activeAgent > 0) {
        abortGeneration();
        return;
    }

    // Validations
    const product = elements.inputProduct.value.trim();
    const brief = elements.inputBrief.value.trim();
    
    if (!product || !brief) {
        showToast('Por favor, rellena los campos de Producto y Descripción.', true);
        return;
    }

    const isVercel = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
    const hasKeys = (state.apiKeys.anthropic && state.apiKeys.deepseek) || (isVercel && state.connectionMode === 'proxy');
    
    // Set Abort Controller
    abortController = new AbortController();
    state.activeAgent = 1;
    
    // Lock all input elements
    setInputState(true);
    
    // Change generate button to red Cancel button
    elements.generateBtn.className = "btn btn-danger";
    elements.generateBtn.innerHTML = '<i class="fa-solid fa-circle-stop"></i> Detener / Pausar Bot';
    elements.generateBtn.disabled = false; // Must remain clickable!
    
    // Reset Nodes Styling
    resetAgentNodes();
    
    if (!hasKeys) {
        logToTerminal('[ADVERTENCIA] No has configurado tus APIs. Se ejecutará el MODO SIMULADO.', 'warning');
        showToast('Ejecutando en Modo Simulación.');
        runSimulation(product, brief);
        return;
    }

    logToTerminal('>>> INICIANDO PIPELINE MULTI-AGENTE DE ANUNCIOS/VIRALES <<<', 'success');
    
    try {
        // ----------------------------------------------------
        // AGENT 1: EL GUIONISTA (Claude 3.5 Sonnet)
        // ----------------------------------------------------
        updateAgentUI(1, 'active', 'Generando Hooks y Guión...');
        logToTerminal('[Guionista] Iniciando llamado a Claude. Analizando briefs y referencias visuales...', 'agent');
        
        const finalTone = state.selectedTone === 'Otro (Personalizado)' ? elements.inputToneCustom.value.trim() : state.selectedTone;
        
        // Multi-call Call 1: Brainstorming Hooks & Outlines
        logToTerminal('[Guionista] [Llamada 1.1] Generando 3 variantes de hooks virales...', 'info');
        
        // Construct visual description metadata if images are attached
        let imageDescriptionsPromptPart = "";
        let anthropicContentArray = [];
        
        if (state.uploadedImages.length > 0) {
            logToTerminal(`[Guionista] Analizando ${state.uploadedImages.length} imágenes de referencia...`, 'info');
            state.uploadedImages.forEach((img, i) => {
                // Split base64 to extract clean data and mime type
                const matches = img.base64.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
                if (matches) {
                    anthropicContentArray.push({
                        type: "image",
                        source: {
                            type: "base64",
                            media_type: matches[1],
                            data: matches[2]
                        }
                    });
                }
            });
        }
        
        const hookPrompt = `Eres un copywriter estrella y experto en marketing viral de TikTok, Instagram Reels e YouTube Shorts.
        El usuario quiere crear un ${state.contentType === 'ad' ? 'Anuncio de Conversión para ventas' : 'Video Viral orgánico'}.
        Detalles del Producto y Buyer Persona:
        ${product}
        
        Tipo de Anuncio/Video solicitado:
        ${brief}
        
        Tono de Marca: ${finalTone}
        
        TAREA:
        1. Analiza las imágenes proporcionadas (si las hay) y los textos.
        2. Escribe 3 Hooks de apertura ultra-impactantes para los primeros 3 segundos.
        3. Elabora un Outline o esquema estructural del video.
        
        Responde en español de forma directa y profesional.`;
        
        anthropicContentArray.push({
            type: "text",
            text: hookPrompt
        });
        
        let anthropicPayload = {
            model: state.anthropicModel,
            max_tokens: 2000,
            messages: [{ role: "user", content: anthropicContentArray }]
        };
        
        let result1 = await callLLM('anthropic', anthropicPayload);
        const hooksResponse = result1.content[0].text;
        logToTerminal('[Guionista] Hooks y Outline generados con éxito.', 'success');
        
        if (abortController.signal.aborted) throw new DOMException('Aborted', 'AbortError');
        
        // Multi-call Call 2: Scripting based on selected hooks
        logToTerminal('[Guionista] [Llamada 1.2] Escribiendo guión dramático humanizado...', 'info');
        updateAgentUI(1, 'active', 'Escribiendo el Guión Refinado...');
        
        const scriptPrompt = `Aquí tienes las ideas de hooks y la estructura inicial:
        ${hooksResponse}
        
        Ahora, escribe el GUIÓN completo final paso a paso.
        Requisitos del Guión:
        - Debe durar entre 30 y 60 segundos.
        - Debe estar humanizado, natural, con pausas marcadas.
        - Estructura variable/generativa: Decide creativamente si usar POV, pantalla dividida, cara a cámara, o tomas detalle (B-roll), justificándolo.
        - Escribe en columnas claras:
          [ESCENA X - TIEMPO]
          AUDIO (Voz en off o Diálogo): El texto exacto a narrar.
          ACCIÓN VISUAL: Qué se ve en pantalla. Pacing y ritmo.
          
        REGLA DE CONTINUIDAD NARRATIVA: El guión debe mantener una consistencia estricta. Si se introduce un protagonista (ej: "un joven deportista"), el producto (ej: "termo negro brillante"), o un coche (ej: "sedán rojo"), deben ser los mismos de principio a fin del guión. No cambies el sujeto o sus características fundamentales a mitad de la historia.
        
        Genera el guión ahora.`;
        
        anthropicPayload.messages.push({ role: "assistant", content: [{ type: "text", text: hooksResponse }] });
        anthropicPayload.messages.push({ role: "user", content: [{ type: "text", text: scriptPrompt }] });
        
        let result2 = await callLLM('anthropic', anthropicPayload);
        const fullScript = result2.content[0].text;
        logToTerminal('[Guionista] Guión completo escrito con éxito.', 'success');
        updateAgentUI(1, 'done', 'Guión listo.');
        
        if (abortController.signal.aborted) throw new DOMException('Aborted', 'AbortError');
        
        // ----------------------------------------------------
        // AGENT 2: EL DIRECTOR CREATIVO (Claude 3.5 Sonnet)
        // ----------------------------------------------------
        updateAgentUI(2, 'active', 'Generando Blueprint y Escenas...');
        logToTerminal('[Director] Analizando el guión para extraer la consistencia visual y dividir en escenas...', 'agent');
        
        // Call 2.1 & 2.2: Extract Visual Blueprint & JSON breakdown
        const directorPrompt = `Eres un Director Creativo cinematográfico. Tu trabajo es revisar el siguiente guión y crear:
        1. Un "Blueprint de Continuidad Visual" estricto escrito COMPLETAMENTE EN INGLÉS para los elementos físicos clave, usando las siguientes etiquetas exactas:
           - === CENTRAL PRODUCT (ENGLISH DESCRIPTION) ===
             Colores exactos, materiales, texturas, formas y logotipos del producto.
           - === MAIN CHARACTER (ENGLISH DESCRIPTION) ===
             Rango de edad, rasgos faciales, género, peinado, ropa exacta (colores y tipo de prenda) del personaje.
           - === VEHICLE / LARGE PROP (ENGLISH DESCRIPTION) === (si aplica)
             Marca, modelo, estilo y color exacto de pintura.
           - === ENVIRONMENT / BACKGROUND (ENGLISH DESCRIPTION) ===
             Paleta cromática dominante, estilo de fondo e iluminación ambiental.
           Si hay imágenes de referencia, extrae estos datos estrictamente de ellas. Si no las hay, invéntalos en base al brief y detállalos en inglés al extremo para asegurar la coherencia visual.
        2. Dividir el guión en escenas estructuradas, asegurando que la acción visual respete el blueprint establecido.
        
        Aquí está el guión:
        ${fullScript}
        
        IMPORTANTE: Responde ÚNICAMENTE en formato JSON. El arreglo "scenes" DEBE incluir cada una de las escenas del guión proporcionado. Si el guión tiene múltiples escenas, debes incluirlas todas en el arreglo (ej. Escena 1, Escena 2, etc.), no te limites a una sola.
        Estructura exacta requerida:
        {
          "blueprint": "=== CENTRAL PRODUCT (ENGLISH DESCRIPTION) ===\n[details...]\n\n=== MAIN CHARACTER (ENGLISH DESCRIPTION) ===\n[details...]\n\n=== VEHICLE / LARGE PROP (ENGLISH DESCRIPTION) ===\n[details...]\n\n=== ENVIRONMENT / BACKGROUND (ENGLISH DESCRIPTION) ===\n[details...]",
          "scenes": [
            {
              "number": 1,
              "time": "0:00 - 0:03",
              "visualDescription": "descripción de lo que ocurre visualmente en la escena 1...",
              "dialogue": "dialogo o voz en off en la escena 1..."
            },
            {
              "number": 2,
              "time": "0:03 - 0:06",
              "visualDescription": "descripción de lo que ocurre visualmente en la escena 2...",
              "dialogue": "dialogo o voz en off en la escena 2..."
            }
            // ... (incluye todas y cada una de las escenas del guión aquí)
          ]
        }`;
        
        // Re-use current base64 images if available, else send text
        let directorContentArray = [];
        if (state.uploadedImages.length > 0) {
            state.uploadedImages.forEach((img) => {
                const matches = img.base64.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
                if (matches) {
                    directorContentArray.push({
                        type: "image",
                        source: {
                            type: "base64",
                            media_type: matches[1],
                            data: matches[2]
                        }
                    });
                }
            });
        }
        directorContentArray.push({
            type: "text",
            text: directorPrompt
        });
        
        let anthropicPayloadDirector = {
            model: state.anthropicModel,
            max_tokens: 3000,
            messages: [{ role: "user", content: directorContentArray }]
        };
        
        let resultDirector = await callLLM('anthropic', anthropicPayloadDirector);
        const directorResponseText = resultDirector.content[0].text;
        
        let parsedDirector = {};
        try {
            // Clean markdown blocks if LLM wrapper outputs ```json ... ```
            const jsonCleaned = cleanJsonString(directorResponseText);
            parsedDirector = JSON.parse(jsonCleaned);
            logToTerminal('[Director] Blueprint de Continuidad y Escenas extraídos correctamente.', 'success');
        } catch (e) {
            logToTerminal('[Director] [Advertencia] Error al parsear JSON directo, intentando parseo tolerante...', 'warning');
            parsedDirector = fallbackExtractJSON(directorResponseText, fullScript);
        }
        
        updateAgentUI(2, 'done', 'Escenas estructuradas.');
        
        if (abortController.signal.aborted) throw new DOMException('Aborted', 'AbortError');
        
        // ----------------------------------------------------
        // AGENT 3: EL PROMPTER (DeepSeek-V3)
        // ----------------------------------------------------
        updateAgentUI(3, 'active', 'Creando prompts Veo 3 y ElevenLabs...');
        logToTerminal('[Prompter] Iniciando llamado a DeepSeek. Elaborando prompts ultra-completos para Veo 3...', 'agent');
        
        const deepseekPrompt = `Eres un Ingeniero de Prompts Experto y Especialista en Audio.
        Recibes la siguiente estructura de escenas y un Blueprint de Continuidad Visual en inglés:
        
        Blueprint de Continuidad:
        ${parsedDirector.blueprint}
        
        Escenas:
        ${JSON.stringify(parsedDirector.scenes, null, 2)}
        
        TAREA:
        1. Para cada escena, escribe un PROMT ULTRA-COMPLETO EN INGLÉS para VEO 3 (generador de video de Google). Los prompts de Veo 3 deben estructurarse de la siguiente manera:
           - Estructura: [Tipo de plano/toma y ángulo] [Descripción de la acción] [Sujeto/Personaje principal con detalles de continuidad] [Entorno con detalles de continuidad] [Estilo de iluminación y atmósfera] [Lente de cámara y estilo estético cinematográfico].
           
           - ETIQUETAS DE CONTINUIDAD OBLIGATORIAS: En lugar de redactar libremente el producto, personaje o coche principal, debes envolverlos EXACTAMENTE en corchetes con sus respectivas etiquetas:
             * Para el Producto: [PRODUCT: <descripción del blueprint>]
             * Para el Personaje Principal: [CHARACTER: <descripción del blueprint>]
             * Para el Vehículo: [VEHICLE: <descripción del blueprint>]
             * Para el Entorno/Fondo: [ENVIRONMENT: <descripción del blueprint>]
             
             Ejemplo de estructura de prompt con etiquetas:
             "A cinematic medium dolly shot of [CHARACTER: a 30-year-old tall African-American man wearing a red cap] sitting on a wooden bench inside [ENVIRONMENT: a minimal industrial concrete loft with dramatic volumetric lighting], holding [PRODUCT: a glossy black wooden baseball bat with a white logo], camera panning slowly."
             
           - COPIAR VERBATIM: Debes copiar y pegar literalmente (palabra por palabra en inglés) los descriptores físicos del "Blueprint de Continuidad Visual" dentro de las etiquetas correspondientes. No parafrasees, no resumas y no varíes los términos entre escenas. Si la escena no involucra al personaje o producto, no incluyas esa etiqueta.
           
           - Define al final del prompt parámetros cinemáticos: movimientos de cámara suaves (Dolly, pan, tilt), iluminación (Moody volumetric, Soft studio), lente (35mm lens, depth of field) y estilo general.
        2. Escribe una TRASCRIPCIÓN limpia de audio para cada escena optimizada para ElevenLabs. Agrega marcadores de actuación o tono (ej: [pause], [excited], [whisper], [intimate]) y guías de pronunciación si es necesario.
        3. Escribe un guión de audio completo unificado para ElevenLabs.
        
        IMPORTANTE: El arreglo "scenes" de tu JSON de salida DEBE incluir cada una de las escenas que recibiste en la entrada. Si recibiste múltiples escenas, debes procesarlas y retornarlas todas en el arreglo, no te limites a una sola.
        Responde ÚNICAMENTE en formato JSON con la siguiente estructura exacta:
        {
          "fullDialogue": "Guión de audio completo con tags de tono...",
          "scenes": [
            {
              "number": 1,
              "time": "0:00 - 0:03",
              "visualDescription": "descripción de la escena 1...",
              "veoPrompt": "Prompt de Veo 3 con etiquetas [PRODUCT: ...], [CHARACTER: ...], etc. para la escena 1...",
              "elevenLabsScript": "Trascripción de audio optimizada para la escena 1..."
            },
            {
              "number": 2,
              "time": "0:03 - 0:06",
              "visualDescription": "descripción de la escena 2...",
              "veoPrompt": "Prompt de Veo 3 con etiquetas [PRODUCT: ...], [CHARACTER: ...], etc. para la escena 2...",
              "elevenLabsScript": "Trascripción de audio optimizada para la escena 2..."
            }
            // ... (incluye exactamente todas las escenas de la entrada aquí)
          ]
        }`;
        
        const deepseekPayload = {
            model: state.deepseekModel,
            messages: [
                { role: "system", content: "Eres un asistente de Inteligencia Artificial enfocado en JSON estructurado y prompt engineering científico." },
                { role: "user", content: deepseekPrompt }
            ],
            response_format: { type: "json_object" }
        };
        
        let resultDeepseek = await callLLM('deepseek', deepseekPayload);
        
        let finalOutput = {};
        try {
            const dsContent = resultDeepseek.choices[0].message.content;
            finalOutput = JSON.parse(cleanJsonString(dsContent));
            logToTerminal('[Prompter] Prompts de Veo 3 y ElevenLabs creados con éxito.', 'success');
        } catch (e) {
            logToTerminal('[Prompter] Error al parsear JSON de DeepSeek. Estructurando respuesta de contingencia.', 'warning');
            finalOutput = compileDeepSeekFallback(parsedDirector);
        }
        
        // Add the blueprint back to final result
        finalOutput.blueprint = parsedDirector.blueprint;
        
        // Save project and transition to studio view
        state.currentProject = finalOutput;
        // Keep high-resolution images in-memory for active studio view
        state.currentProject.images = state.uploadedImages.map(img => img.base64);
        
        // Compress images asynchronously to lightweight thumbnails for localStorage history saving (quota prevention)
        logToTerminal('[Prompter] Optimizando imágenes para persistencia local...', 'info');
        const compressedThumbnails = [];
        for (const img of state.uploadedImages) {
            try {
                const comp = await compressImageAsync(img.base64, 250, 250);
                compressedThumbnails.push(comp);
            } catch (err) {
                compressedThumbnails.push(img.base64); // Fallback
            }
        }
        
        if (abortController.signal.aborted) throw new DOMException('Aborted', 'AbortError');
        
        const hasSupabase = !!state.supabase.url && !!state.supabase.key;
        if (hasSupabase) {
            logToTerminal('[Base de Datos] Guardando proyecto en Supabase...', 'info');
            try {
                const newItem = {
                    timestamp: new Date().toLocaleString(),
                    product: product,
                    brief: brief,
                    tone: finalTone,
                    images: compressedThumbnails, // Stored as lightweight thumbnails
                    project: finalOutput
                };
                // In Supabase, the table is "projects"
                const response = await callSupabase('POST', 'projects', newItem);
                if (response && response.length > 0) {
                    state.savedProjects.unshift({
                        id: response[0].id,
                        ...newItem
                    });
                } else {
                    state.savedProjects.unshift({
                        id: Date.now(),
                        ...newItem
                    });
                }
                logToTerminal('[Base de Datos] Proyecto guardado con éxito en la nube (Supabase).', 'success');

            } catch (err) {
                logToTerminal(`[Base de Datos] [ERROR] No se pudo guardar en Supabase: ${err.message}.`, 'warning');
            }
        } else {
            logToTerminal('[Base de Datos] No se guardó el historial (Supabase no configurado).', 'warning');
        }
        
        updateAgentUI(3, 'done', 'Campaña completada.');
        logToTerminal('>>> PROCESO FINALIZADO CON ÉXITO. ABRIENDO STUDIO VIEW <<<', 'success');
        
        const successTimeout = setTimeout(() => {
            renderStudioView();
            resetGenerationUI();
            switchView('studio');
        }, 1500);
        simulationTimeouts.push(successTimeout);
        
    } catch (error) {
        if (error.name === 'AbortError') {
            logToTerminal('[SISTEMA] Generación cancelada por el usuario. Bot detenido.', 'warning');
            showToast('Generación cancelada.');
        } else {
            logToTerminal(`[ERROR] El pipeline falló: ${error.message}`, 'warning');
            showToast('Error en la generación. Verifica tus API Keys o la consola.', true);
        }
        resetAgentNodes();
        resetGenerationUI();
    }
}

// Reset Agent Node visuals
function resetAgentNodes() {
    elements.agent1Node.className = 'agent-node';
    elements.agent2Node.className = 'agent-node';
    elements.agent3Node.className = 'agent-node';
    elements.statusAgent1.textContent = 'Esperando para iniciar...';
    elements.statusAgent2.textContent = 'Esperando guión...';
    elements.statusAgent3.textContent = 'Esperando blueprint...';
    elements.spinnerAgent1.classList.add('hidden');
    elements.spinnerAgent2.classList.add('hidden');
    elements.spinnerAgent3.classList.add('hidden');
}

// Update Agent visual states
function updateAgentUI(agentNum, state, statusText) {
    const node = document.getElementById(`agent-${agentNum}-node`);
    const spinner = document.getElementById(`spinner-agent-${agentNum}`);
    const status = document.getElementById(`status-agent-${agentNum}`);
    
    node.className = `agent-node ${state}`;
    status.textContent = statusText;
    
    if (state === 'active') {
        spinner.classList.remove('hidden');
    } else {
        spinner.classList.add('hidden');
    }
}

// Rendering Studio Output Dashboard
function renderStudioView() {
    const proj = state.currentProject;
    if (!proj) return;
    
    // Continuity Blueprint
    elements.blueprintContent.textContent = proj.blueprint || 'No se definió blueprint.';
    
    // Blueprint Images
    elements.blueprintImagesContainer.innerHTML = '';
    if (proj.images && proj.images.length > 0) {
        proj.images.forEach(imgBase64 => {
            const imgDiv = document.createElement('div');
            imgDiv.className = 'preview-item';
            imgDiv.innerHTML = `<img src="${imgBase64}">`;
            elements.blueprintImagesContainer.appendChild(imgDiv);
        });
    }
    
    // ElevenLabs complete transcript
    const fullAudio = proj.fullDialogue || proj.full_dialogue || '';
    elements.fullAudioContent.innerHTML = formatDialogueWithHighlights(fullAudio);
    
    // Storyboard Cards Grid
    elements.storyboardContainer.innerHTML = '';
    const scenes = proj.scenes || proj.scenarios || [];
    if (Array.isArray(scenes)) {
        scenes.forEach(scene => {
            const sceneNum = scene.number || scene.scene_number || 1;
            const sceneTime = scene.time || scene.scene_time || '';
            
            // Defensive fallbacks for prompts and dialogues
            const rawVeoPrompt = scene.veoPrompt || scene.veo_prompt || `Google Veo 3, scene ${sceneNum}. ${scene.visualDescription || scene.visual_description || ''}`;
            const processedVeoPrompt = processPromptWithRefToggles(rawVeoPrompt);
            const rawAudioScript = scene.elevenLabsScript || scene.eleven_labs_script || scene.dialogue || '';
            
            const card = document.createElement('div');
            card.className = 'scene-card';
            card.innerHTML = `
                <div class="scene-badge">
                    <div class="scene-number">${sceneNum}</div>
                    <div class="scene-time">${sceneTime}</div>
                </div>
                
                <!-- Visual Section -->
                <div class="scene-block">
                    <div class="scene-block-title visual">
                        <span><i class="fa-solid fa-camera"></i> Promt Veo 3</span>
                        <button class="copy-btn-mini copy-scene-prompt" data-prompt="${processedVeoPrompt.replace(/"/g, '&quot;')}">
                            <i class="fa-solid fa-copy"></i>
                        </button>
                    </div>
                    <div class="scene-content" style="border-left: 3px solid var(--secondary)">
                        ${highlightPromptKeywords(processedVeoPrompt)}
                    </div>
                </div>
                
                <!-- Audio Section -->
                <div class="scene-block">
                    <div class="scene-block-title audio">
                        <span><i class="fa-solid fa-microphone"></i> ElevenLabs Script</span>
                        <button class="copy-btn-mini copy-scene-audio" data-audio="${rawAudioScript.replace(/"/g, '&quot;')}">
                            <i class="fa-solid fa-copy"></i>
                        </button>
                    </div>
                    <div class="scene-content" style="border-left: 3px solid var(--accent)">
                        ${formatDialogueWithHighlights(rawAudioScript)}
                    </div>
                </div>
            `;
            
            card.querySelector('.copy-scene-prompt').addEventListener('click', (e) => {
                const btn = e.currentTarget;
                copyToClipboard(btn.getAttribute('data-prompt'));
                showToast('Prompt Veo 3 copiado');
            });
            
            card.querySelector('.copy-scene-audio').addEventListener('click', (e) => {
                const btn = e.currentTarget;
                copyToClipboard(btn.getAttribute('data-audio'));
                showToast('Script de audio copiado');
            });
            
            elements.storyboardContainer.appendChild(card);
        });
    }
}

function processPromptWithRefToggles(promptText) {
    if (!promptText) return '';
    let result = promptText;
    
    const useProductRef = elements.toggleRefProduct && elements.toggleRefProduct.checked;
    const useCharacterRef = elements.toggleRefCharacter && elements.toggleRefCharacter.checked;
    
    if (useProductRef) {
        result = result.replace(/\[PRODUCT:\s*([^\]]+)\]/gi, "the product shown in the reference image");
    } else {
        result = result.replace(/\[PRODUCT:\s*([^\]]+)\]/gi, "$1");
    }
    
    if (useCharacterRef) {
        result = result.replace(/\[CHARACTER:\s*([^\]]+)\]/gi, "the character shown in the reference image");
    } else {
        result = result.replace(/\[CHARACTER:\s*([^\]]+)\]/gi, "$1");
    }
    
    // Strip other tags
    result = result.replace(/\[VEHICLE:\s*([^\]]+)\]/gi, "$1");
    result = result.replace(/\[ENVIRONMENT:\s*([^\]]+)\]/gi, "$1");
    
    return result;
}

// Higlighting tone tags and continuity anchors
function formatDialogueWithHighlights(text) {
    if (!text) return '';
    // Format [excited] [pause] tags with accent styling
    return text.replace(/\[([^\]]+)\]/g, '<span class="audio-tag">[$1]</span>');
}

function highlightPromptKeywords(prompt) {
    if (!prompt) return '';
    // Match common Google Veo 3 prompt constructs or visual continuity references
    return prompt
        .replace(/(idéntico|idéntica|idénticos|mismo|misma|mismos|consistencia|continuidad|continuity|reference image|shown in the reference)/gi, '<span class="anchor-highlight">$1</span>')
        .replace(/(camara|iluminación|lente|toma|angulo|panorámica|first person view|POV|close up|macro|dolly|camera|lighting|shot|pan|tilt|lens)/gi, '<strong>$1</strong>');
}

// Helper: JSON cleaners
function cleanJsonString(str) {
    return str
        .replace(/^```json/i, '')
        .replace(/^```/i, '')
        .replace(/```$/i, '')
        .trim();
}

function fallbackExtractJSON(rawText, fullScript) {
    // If the LLM didn't reply in parseable JSON, we parse manually to prevent breaking the flow
    logToTerminal('Parseador manual de emergencia activado.', 'warning');
    
    // Extract blueprint
    let blueprint = "Producto consistente en escena con iluminación cinemática.";
    const bpMatch = rawText.match(/blueprint["'\s]+:[\s"']+(.*?)["']\s*,/is);
    if (bpMatch) {
        blueprint = bpMatch[1].trim();
    } else {
        const bpHeadingMatch = rawText.match(/(?:blueprint|continuidad|blueprint de continuidad visual)[:\-\s]+(.*?)(?=(escena|scenes|scenes"|{\s*")|$)/is);
        if (bpHeadingMatch) {
            blueprint = bpHeadingMatch[1].trim();
        }
    }
    
    const scenes = [];
    
    // Split fullScript by "ESCENA" or "Scene" headings
    const sceneBlocks = fullScript.split(/(?:ESCENA|Scene)\s*(\d+)/i);
    if (sceneBlocks.length > 2) {
        for (let i = 1; i < sceneBlocks.length; i += 2) {
            const num = parseInt(sceneBlocks[i]);
            const content = sceneBlocks[i + 1] || '';
            
            // Extract dialogue (AUDIO)
            let dialogue = '';
            const audioMatch = content.match(/(?:AUDIO|Voz en off|Diálogo|Narración)\s*(?:\([^)]+\))?[:\-]?\s*(.*?)(?=(?:ACCIÓN VISUAL|VISUAL|Cámara|Imagen|Video|ESCENA|Scene|$))/is);
            if (audioMatch) {
                dialogue = audioMatch[1].trim();
            }
            
            // Extract visual (ACCIÓN VISUAL)
            let visualDescription = '';
            const visualMatch = content.match(/(?:ACCIÓN VISUAL|VISUAL|Cámara|Imagen|Video)[:\-]?\s*(.*?)(?=(?:AUDIO|Voz en off|Diálogo|Narración|ESCENA|Scene|$))/is);
            if (visualMatch) {
                visualDescription = visualMatch[1].trim();
            }
            
            // Extract time
            let time = `0:0${(num-1)*4} - 0:0${num*4}`;
            const timeMatch = content.match(/(?:TIEMPO|DURACIÓN|Time)[:\-]?\s*([0-9:\-\s]+)/i);
            if (timeMatch) {
                time = timeMatch[1].trim();
            }
            
            if (visualDescription || dialogue) {
                scenes.push({
                    number: num,
                    time: time,
                    visualDescription: visualDescription || "Toma de producto de alta calidad en consistencia con el blueprint.",
                    dialogue: dialogue || ""
                });
            }
        }
    }
    
    if (scenes.length === 0) {
        scenes.push({
            number: 1,
            time: "0:00 - 0:15",
            visualDescription: "Toma de producto de alta calidad.",
            dialogue: "Descubre el nuevo inflador portátil."
        });
    }
    
    return { blueprint, scenes };
}

function compileDeepSeekFallback(directorData) {
    return {
        fullDialogue: directorData.scenes.map(s => `[Escena ${s.number}] ${s.dialogue}`).join('\n'),
        scenes: directorData.scenes.map(s => ({
            number: s.number,
            time: s.time,
            visualDescription: s.visualDescription,
            veoPrompt: `Google Veo 3, cinematic scene ${s.number}, visual continuity. ${s.visualDescription}. Visual parameters: ${directorData.blueprint}`,
            elevenLabsScript: `[excited] ${s.dialogue}`
        }))
    };
}

// RENDER HISTORIAL DE PROYECTOS (GALLERY)
function renderGallery() {
    if (state.savedProjects.length === 0) {
        elements.galleryEmptyState.classList.remove('hidden');
        elements.galleryGrid.classList.add('hidden');
        elements.clearGalleryBtn.style.display = 'none';
        return;
    }

    elements.galleryEmptyState.classList.add('hidden');
    elements.galleryGrid.classList.remove('hidden');
    elements.clearGalleryBtn.style.display = 'block';
    
    elements.galleryGrid.innerHTML = '';
    
    state.savedProjects.forEach((proj) => {
        const card = document.createElement('div');
        card.className = 'glass-card interactive';
        card.style.display = 'flex';
        card.style.flexDirection = 'column';
        card.style.gap = '1rem';
        
        let typeBadge = proj.project.scenes ? `${proj.project.scenes.length} Escenas` : '';
        
        card.innerHTML = `
            <div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                    <span class="api-badge" style="font-size: 0.75rem; background: rgba(6, 182, 212, 0.1); border-color: rgba(6, 182, 212, 0.2); color: var(--secondary)">
                        ${proj.tone}
                    </span>
                    <span style="font-size: 0.75rem; color: var(--text-muted)">${proj.timestamp}</span>
                </div>
                <h4 style="font-size: 1.1rem; margin-bottom: 0.5rem;" class="text-gradient-rose">
                    ${proj.brief.substring(0, 50)}...
                </h4>
                <p class="text-secondary" style="font-size: 0.85rem; line-height: 1.4;">
                    <strong>Producto:</strong> ${proj.product.substring(0, 100)}...
                </p>
            </div>
            
            <div style="display: flex; gap: 0.5rem; margin-top: auto;">
                <button class="btn btn-secondary load-project-btn" style="flex: 1; font-size: 0.85rem; padding: 0.5rem;" data-id="${proj.id}">
                    <i class="fa-solid fa-eye"></i> Abrir
                </button>
                <button class="btn btn-secondary delete-project-btn" style="color: #ef4444; border-color: rgba(239, 68, 68, 0.2); padding: 0.5rem;" data-id="${proj.id}">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </div>
        `;
        
        card.querySelector('.load-project-btn').addEventListener('click', () => {
            state.currentProject = proj.project;
            // Restore images associated with this project (the thumbnails)
            state.currentProject.images = proj.images || [];
            renderStudioView();
            switchView('studio');
        });
        
        card.querySelector('.delete-project-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            deleteProject(proj.id);
        });
        
        elements.galleryGrid.appendChild(card);
    });
}

async function deleteProject(id) {
    const hasSupabase = !!state.supabase.url && !!state.supabase.key;
    if (hasSupabase) {
        logToTerminal(`[Base de Datos] Eliminando proyecto ID ${id} de Supabase...`, 'info');
        try {
            await callSupabase('DELETE', `projects?id=eq.${id}`);
            logToTerminal('[Base de Datos] Proyecto eliminado de la nube.', 'success');
            state.savedProjects = state.savedProjects.filter(p => p.id !== id);
            renderGallery();
            showToast('Proyecto eliminado.');
        } catch (err) {
            logToTerminal(`[Base de Datos] [ERROR] No se pudo eliminar de la nube: ${err.message}`, 'warning');
            showToast('Error al eliminar de Supabase.', true);
        }
    } else {
        logToTerminal('[Base de Datos] Supabase no está configurado. No se puede eliminar el proyecto.', 'warning');
        showToast('Supabase no configurado.', true);
    }
}

async function clearGallery() {
    const hasSupabase = !!state.supabase.url && !!state.supabase.key;
    if (!hasSupabase) {
        showToast('Supabase no está configurado.', true);
        return;
    }
    
    if (confirm('¿Estás seguro de que quieres borrar todo tu historial de Supabase (Nube)?')) {
        logToTerminal('[Base de Datos] Vaciando tabla de Supabase...', 'info');
        try {
            await callSupabase('DELETE', 'projects?id=gt.0');
            logToTerminal('[Base de Datos] Historial en la nube vaciado con éxito.', 'success');
            state.savedProjects = [];
            renderGallery();
            showToast('Historial vaciado.');
        } catch (err) {
            logToTerminal(`[Base de Datos] [ERROR] No se pudo vaciar la nube: ${err.message}`, 'warning');
            showToast('Error al vaciar la nube.', true);
        }
    }
}

// ----------------------------------------------------
// DEMO / SIMULATION MODE
// ----------------------------------------------------
function runSimulation(product, brief) {
    // Clear any previous simulation timeouts
    simulationTimeouts.forEach(clearTimeout);
    simulationTimeouts = [];

    let timeline = [
        { time: 1000, agent: 1, state: 'active', text: 'Analizando briefs de entrada y referencias...', type: 'info' },
        { time: 2500, agent: 1, state: 'active', text: 'Llamada 1.1: Generando ideas de ganchos virales (Hooks)...', type: 'info' },
        { time: 4000, agent: 1, state: 'active', text: 'Hooks creados. Escogiendo el Hook #2 (Contraste Dramático). Escribiendo guión...', type: 'info' },
        { time: 6000, agent: 1, state: 'done', text: 'Guión completo redactado (5 escenas).', type: 'success' },
        
        { time: 7000, agent: 2, state: 'active', text: 'Leyendo guión. Creando blueprint de consistencia del producto...', type: 'info' },
        { time: 8500, agent: 2, state: 'active', text: 'Fijando parámetros: Termo negro mate, detalles de textura de agarre, tapa roscable pulida. Logo vertical blanco.', type: 'info' },
        { time: 10000, agent: 2, state: 'done', text: 'Blueprint fijado. Escenas divididas y indexadas.', type: 'success' },
        
        { time: 11000, agent: 3, state: 'active', text: 'Llamando a DeepSeek. Construyendo prompts estructurados para Veo 3...', type: 'info' },
        { time: 12500, agent: 3, state: 'active', text: 'Formateando trascripción con inflexión emocional para ElevenLabs...', type: 'info' },
        { time: 14000, agent: 3, state: 'done', text: 'Prompts de video y audio unificados creados.', type: 'success' }
    ];

    timeline.forEach(step => {
        const timeoutId = setTimeout(() => {
            updateAgentUI(step.agent, step.state, step.text);
            logToTerminal(`[Agent ${step.agent}] ${step.text}`, step.type === 'success' ? 'success' : 'agent');
            
            if (step.agent === 3 && step.state === 'done') {
                finalizeSimulation(product, brief);
            }
        }, step.time);
        simulationTimeouts.push(timeoutId);
    });
}

async function finalizeSimulation(product, brief) {
    const finalTone = state.selectedTone === 'Otro (Personalizado)' ? elements.inputToneCustom.value.trim() : state.selectedTone;
    
    // Simulate output content
    const mockOutput = {
        blueprint: `Consistencia Visual: El termo inteligente se describe como un recipiente cilíndrico de acero inoxidable de color negro mate (acabado esmerilado texturizado), con una tapa de rosca negra que integra una pantalla circular LED azul en el centro. El cuerpo del termo tiene líneas ergonómicas de agarre. Mantener estos atributos físicos idénticos en todas las escenas, cuidando de no alterar los materiales o el color de la pantalla.`,
        fullDialogue: `[energetic] ¿Sigues tomando café frío en la oficina? [pause] ¡Esto es ridículo! [normal] Mira esto. [pause] Un termo común se enfría en dos horas. [excited] Pero con este termo inteligente de acero inoxidable... [whisper] solo tocas la tapa y tienes la temperatura exacta de tu café todo el día. [excited] Haz clic abajo y llévate el tuyo hoy mismo con envío gratis.`,
        scenes: [
            {
                number: 1,
                time: "0:00 - 0:03",
                visualDescription: "Un plano POV en primera persona de una persona frustrada en su escritorio de oficina, haciendo una mueca al dar un sorbo a una taza de cerámica estándar, indicando café frío.",
                veoPrompt: "Google Veo 3, 4k, cinematic lighting, POV shot. [CHARACTER: A young professional office worker] makes a disgusted face. Blurred office background, modern computers and warm studio lighting.",
                elevenLabsScript: "[energetic] ¿Sigues tomando café frío en la oficina? [pause] ¡Esto es ridículo!"
            },
            {
                number: 2,
                time: "0:03 - 0:06",
                visualDescription: "Toma de detalle del termo inteligente negro mate sobre el escritorio. La mano del protagonista toca suavemente la tapa LED circular, la cual se enciende mostrando '65°C' en luz azul brillante.",
                veoPrompt: "Google Veo 3, extreme macro shot, high-end commercial style. A hand gently taps the top cap of [PRODUCT: a cylindrical matte black textured stainless steel smart thermos]. A circular LED display screen on the cap glows bright blue reading '65°C'. Soft cinematic backlighting, shallow depth of field.",
                elevenLabsScript: "[normal] Mira esto. [pause] Un termo común se enfría en dos horas."
            },
            {
                number: 3,
                time: "0:06 - 0:10",
                visualDescription: "Plano medio de la misma persona sonriendo, sentada cómodamente, bebiendo del termo inteligente negro mate con acabado texturizado (consistente con escena anterior). Se ve relajado y satisfecho.",
                veoPrompt: "Google Veo 3, medium close-up, high-end commercial. [CHARACTER: A young professional office worker] smiles satisfied at his office desk, drinking from [PRODUCT: a cylindrical matte black textured stainless steel smart thermos]. The thermos has a black twist cap, identical to the previous scene. Natural warm lighting.",
                elevenLabsScript: "[excited] Pero con este termo inteligente de acero inoxidable... [whisper] solo tocas la tapa y tienes la temperatura exacta de tu café todo el día."
            },
            {
                number: 4,
                time: "0:10 - 0:15",
                visualDescription: "Toma de producto de catálogo girando sobre una base retroiluminada. Se muestra el termo inteligente negro mate (con su tapa LED circular y pantalla azul) con gotas de condensación fresca en su superficie. Un botón de 'Compra Ahora' flotando en el aire.",
                veoPrompt: "Google Veo 3, studio product commercial shot, clean black background. [PRODUCT: A cylindrical matte black textured stainless steel smart thermos] rotates slowly on a glowing neon base. The top cap has the circular LED display. Small fresh water droplets slide down the matte surface. Volumetric lighting.",
                elevenLabsScript: "[excited] Haz clic abajo y llévate el tuyo hoy mismo con envío gratis."
            }
        ]
    };

    state.currentProject = mockOutput;
    // Keep high-resolution images in-memory for active studio view
    state.currentProject.images = state.uploadedImages.map(img => img.base64);
    
    // Compress images asynchronously to lightweight thumbnails for Supabase persistence
    logToTerminal('[Prompter] Optimizando imágenes para persistencia...', 'info');
    const compressedThumbnails = [];
    for (const img of state.uploadedImages) {
        try {
            const comp = await compressImageAsync(img.base64, 250, 250);
            compressedThumbnails.push(comp);
        } catch (err) {
            compressedThumbnails.push(img.base64); // Fallback
        }
    }
    
    const hasSupabase = !!state.supabase.url && !!state.supabase.key;
    if (hasSupabase) {
        logToTerminal('[Base de Datos] Guardando proyecto de simulación en Supabase...', 'info');
        try {
            const newItem = {
                timestamp: new Date().toLocaleString(),
                product: product,
                brief: brief,
                tone: finalTone,
                images: compressedThumbnails, // Stored as lightweight thumbnails
                project: mockOutput
            };
            const response = await callSupabase('POST', 'projects', newItem);
            if (response && response.length > 0) {
                state.savedProjects.unshift({
                    id: response[0].id,
                    ...newItem
                });
            } else {
                state.savedProjects.unshift({
                    id: Date.now(),
                    ...newItem
                });
            }
            logToTerminal('[Base de Datos] Proyecto de simulación guardado con éxito en Supabase.', 'success');
        } catch (err) {
            logToTerminal(`[Base de Datos] [ERROR] Falló al guardar simulación en Supabase: ${err.message}.`, 'warning');
        }
    } else {
        logToTerminal('[Base de Datos] No se guardó el historial (Supabase no configurado).', 'warning');
    }
    
    logToTerminal('>>> PROCESO FINALIZADO CON ÉXITO (MOCK MODO). ABRIENDO STUDIO VIEW <<<', 'success');
    
    const viewSwitchTimeout = setTimeout(() => {
        renderStudioView();
        resetGenerationUI();
        switchView('studio');
    }, 1500);
    simulationTimeouts.push(viewSwitchTimeout);
}

// Test connection and list available models for Anthropic
async function testAnthropicConnection() {
    const key = elements.apiKeyAnthropic.value.trim();
    if (!key) {
        alert('Introduce primero una API Key de Anthropic.');
        return;
    }
    
    const originalText = elements.testAnthropicBtn.innerHTML;
    elements.testAnthropicBtn.disabled = true;
    elements.testAnthropicBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
    
    // Save key to local state temporarily
    state.apiKeys.anthropic = key;
    
    let url = '';
    const headers = {
        'Content-Type': 'application/json'
    };
    
    if (state.connectionMode === 'proxy') {
        url = getProxyUrl('/api/anthropic/models');
        headers['x-anthropic-key'] = key;
    } else {
        url = 'https://api.anthropic.com/v1/models';
        headers['x-api-key'] = key;
        headers['anthropic-version'] = '2023-06-01';
        headers['anthropic-dangerous-by-pass-browser-validation'] = 'true';
    }
    
    try {
        const response = await fetch(url, { method: 'GET', headers: headers });
        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Error ${response.status}: ${errText}`);
        }
        
        const data = await response.json();
        if (data.data && Array.isArray(data.data)) {
            // Populate select box options dynamically with the returned models
            const select = elements.selectAnthropicModel;
            select.innerHTML = '';
            data.data.forEach(model => {
                const opt = document.createElement('option');
                opt.value = model.id;
                opt.textContent = `${model.id}`;
                select.appendChild(opt);
            });
            // Re-select loaded model if present
            if (data.data.some(m => m.id === state.anthropicModel)) {
                select.value = state.anthropicModel;
            } else {
                state.anthropicModel = select.value;
            }
            alert('Conexión con Anthropic exitosa. Se han cargado los modelos disponibles de tu cuenta.');
        } else {
            alert('Conexión exitosa, pero no se devolvió una lista de modelos.');
        }
    } catch (e) {
        console.error(e);
        alert(`Fallo en la conexión: ${e.message}\nVerifica la API Key o que el proxy local esté corriendo.`);
    } finally {
        elements.testAnthropicBtn.disabled = false;
        elements.testAnthropicBtn.innerHTML = originalText;
    }
}

// Test connection and list available models for DeepSeek
async function testDeepSeekConnection() {
    const key = elements.apiKeyDeepSeek.value.trim();
    if (!key) {
        alert('Introduce primero una API Key de DeepSeek.');
        return;
    }
    
    const originalText = elements.testDeepSeekBtn.innerHTML;
    elements.testDeepSeekBtn.disabled = true;
    elements.testDeepSeekBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
    
    // Save key to local state temporarily
    state.apiKeys.deepseek = key;
    
    let url = '';
    const headers = {
        'Content-Type': 'application/json'
    };
    
    if (state.connectionMode === 'proxy') {
        url = getProxyUrl('/api/deepseek/models');
        headers['x-deepseek-key'] = key;
    } else {
        url = 'https://api.deepseek.com/models';
        headers['Authorization'] = `Bearer ${key}`;
    }
    
    try {
        const response = await fetch(url, { method: 'GET', headers: headers });
        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Error ${response.status}: ${errText}`);
        }
        
        const data = await response.json();
        if (data.data && Array.isArray(data.data)) {
            // Populate select box options dynamically
            const select = elements.selectDeepSeekModel;
            select.innerHTML = '';
            data.data.forEach(model => {
                const opt = document.createElement('option');
                opt.value = model.id;
                opt.textContent = `${model.id}`;
                select.appendChild(opt);
            });
            // Re-select loaded model if present
            if (data.data.some(m => m.id === state.deepseekModel)) {
                select.value = state.deepseekModel;
            } else {
                state.deepseekModel = select.value;
            }
            alert('Conexión con DeepSeek exitosa. Modelos cargados.');
        } else {
            alert('Conexión exitosa, pero no se devolvió una lista de modelos.');
        }
    } catch (e) {
        console.error(e);
        alert(`Fallo en la conexión: ${e.message}\nVerifica la API Key o que el proxy local esté corriendo.`);
    } finally {
        elements.testDeepSeekBtn.disabled = false;
        elements.testDeepSeekBtn.innerHTML = originalText;
    }
}
