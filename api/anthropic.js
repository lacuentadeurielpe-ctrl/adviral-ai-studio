// api/anthropic.js - Proxy para la API de Mensajes de Anthropic en Vercel
module.exports = async (req, res) => {
    // Configuración de cabeceras CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-anthropic-key, x-api-key');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Método no permitido (usar POST)' });
        return;
    }

    // Priorizar llave enviada por cabecera de cliente, luego caer en variable de entorno global en Vercel
    const apiKey = req.headers['x-anthropic-key'] || req.headers['x-api-key'] || process.env.ANTHROPIC_API_KEY;
    
    if (!apiKey) {
        res.status(400).json({ error: 'Falta la API Key de Anthropic. Configúrala en la UI o en las variables de entorno de Vercel (ANTHROPIC_API_KEY).' });
        return;
    }

    try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify(req.body)
        });

        const data = await response.json();
        res.status(response.status).json(data);
    } catch (error) {
        res.status(500).json({ error: 'Error en el proxy de Anthropic: ' + error.message });
    }
};
