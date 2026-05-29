// api/deepseek/models.js - Proxy para listar modelos de DeepSeek en Vercel
module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-deepseek-key, authorization');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'GET') {
        res.status(405).json({ error: 'Método no permitido (usar GET)' });
        return;
    }

    let apiKey = req.headers['x-deepseek-key'];
    if (!apiKey && req.headers['authorization']) {
        const match = req.headers['authorization'].match(/Bearer\s+(.*)/i);
        if (match) {
            apiKey = match[1];
        }
    }
    
    if (!apiKey) {
        apiKey = process.env.DEEPSEEK_API_KEY;
    }

    if (!apiKey) {
        res.status(400).json({ error: 'Falta la API Key de DeepSeek. Configúrala en la UI o en las variables de entorno de Vercel (DEEPSEEK_API_KEY).' });
        return;
    }

    try {
        const response = await fetch('https://api.deepseek.com/models', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`
            }
        });

        const data = await response.json();
        res.status(response.status).json(data);
    } catch (error) {
        res.status(500).json({ error: 'Error en el proxy de modelos de DeepSeek: ' + error.message });
    }
};
