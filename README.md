# AdViral AI Studio 🎬🤖

**AdViral AI Studio** es una plataforma local y portátil de nivel profesional diseñada para generar guiones dramáticos humanizados y prompts ultra-completos con consistencia visual para **Anuncios de Conversión** y **Videos Virales** (TikTok/Reels/Shorts).

Utiliza un pipeline multi-agente que divide las tareas creativas y lógicas en múltiples llamadas coordinadas a modelos de lenguaje avanzados, maximizando la profundidad creativa y el detalle técnico.

---

## 🚀 Cómo Ejecutar la Aplicación

Tienes dos modos para abrir y utilizar la plataforma en tu computadora:

### Método 1: Servidor Proxy Local (Recomendado ⭐)
Este método es el más robusto ya que hospeda la web en tu máquina, elimina cualquier bloqueo de CORS del navegador al llamar a las APIs y protege tus cabeceras.

1. Abre **PowerShell** en la carpeta de este proyecto (`adviral-ai-studio`).
2. Ejecuta el script del servidor integrado:
   ```powershell
   .\run-proxy.ps1
   ```
3. Abre tu navegador favorito (Chrome, Opera GX, Edge) e ingresa a:
   [http://localhost:3000](http://localhost:3000)

*Nota: Si te sale un error de permisos en PowerShell, puedes habilitar temporalmente la ejecución local corriendo `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` y luego iniciar el script.*

### Método 2: Apertura Directa (Portátil 🎒)
Este método es ideal si solo quieres realizar simulaciones rápidas o tienes extensiones de navegación para saltar restricciones de red.

1. Haz doble clic en el archivo [index.html](file:///C:/Users/LENOVO/.gemini/antigravity/scratch/adviral-ai-studio/index.html) para abrirlo directamente en tu navegador.
2. Si vas a conectar tus APIs reales, asegúrate de activar una extensión en tu navegador como "Allow CORS: Access-Control-Allow-Origin" y selecciona **"Modo Conexión Directa"** en el panel de configuración del estudio.
3. Si no posees API Keys o solo quieres probar, puedes dejar las casillas vacías y pulsar **Generar**; el sistema entrará en **Modo Simulación** automáticamente recreando el flujo visual de agentes.

---

## 🤖 El Pipeline Multi-Agente

Para superar los límites de escritura de los modelos en llamadas sencillas, el sistema organiza la tarea en tres agentes que cooperan secuencialmente:

1. **Agente 1: El Guionista (Claude 3.5 Sonnet)**
   * **Paso 1.1 (Brainstorming)**: Evalúa el producto, buyer persona y el brief. Escribe 3 ganchos (Hooks) ultra-potentes y un esquema estructural de retención.
   * **Paso 1.2 (Redacción)**: Escribe el guión final completo (30-60 segundos) usando el mejor gancho y decidiendo si requiere tomas POV, B-roll o cámara subjetiva.
2. **Agente 2: El Director Creativo (Claude 3.5 Sonnet - Visión)**
   * **Paso 2.1 (Blueprint de Continuidad)**: Si subiste fotos de tu producto, Claude (con su capacidad de visión) analiza las imágenes y define rasgos físicos exactos (material, color, texturas, logotipo). Si no hay fotos, extrae un blueprint rígido basado en el texto.
   * **Paso 2.2 (Storyboarding)**: Segmenta el guión en escenas marcando tiempos exactos y adjuntando el Blueprint.
3. **Agente 3: El Especialista en Prompts (DeepSeek-V3)**
   * **Paso 3.1 (ElevenLabs Transcription)**: Extrae el diálogo de voz de cada escena y lo formatea agregando pausas y marcadores de entonación (ej. `[excited]`, `[whisper]`) para copiar directamente a ElevenLabs.
   * **Paso 3.2 (Prompting Científico para Veo 3)**: Escribe prompts detallados para el generador de video de Google (Veo 3), especificando movimiento de cámara (ECU, dolly, panning), iluminación (volumétrica, soft) e introduciendo los *anclajes de continuidad* del Blueprint de forma científica para asegurar que los elementos sean idénticos entre escenas.

---

## 🛠️ Configuración de APIs

Para habilitar la generación real, presiona el botón **Configurar APIs** en la esquina superior derecha y agrega tus credenciales:
* **Anthropic API Key**: Utilizada para Claude 3.5 Sonnet por su destreza en narrativa dramática, razonamiento de marketing y análisis visual.
* **DeepSeek API Key**: Utilizada para DeepSeek-V3 debido a su gran desempeño lógico estructurando formatos JSON limpios y detallando prompts técnicos.

*Ambas claves se guardan de forma 100% segura y local en el `localStorage` de tu navegador, sin transmitirse a servidores de terceros.*

---

## 📦 Estructura del Proyecto

* `index.html` - El dashboard interactivo y la interfaz gráfica de usuario.
* `style.css` - Estilos con diseño moderno glassmorphic, visualizadores de timelines de agentes y animaciones premium.
* `app.js` - Controlador del lado del cliente, lógica del pipeline, lectura de imágenes a base64 y conexión con APIs.
* `run-proxy.ps1` - Servidor web y proxy HTTP local nativo de Windows PowerShell.
* `README.md` - Esta guía de usuario.