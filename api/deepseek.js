// api/deepseek.js - Proxy para la API de Chat de DeepSeek en Vercel
module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-deepseek-key, authorization');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Método no permitido (usar POST)' });
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
        res.status(400).json({ error: 'Falta la API Key de DeepSeek en las cabeceras (x-deepseek-key)' });
        return;
    }

    try {
        const response = await fetch('https://api.deepseek.com/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(req.body)
        });

        const data = await response.json();
        res.status(response.status).json(data);
    } catch (error) {
        res.status(500).json({ error: 'Error en el proxy de DeepSeek: ' + error.message });
    }
};
