const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;
const RIOT_KEY = process.env.RIOT_API_KEY;

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.use(cors({ origin: '*' }));
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'Rift Coach API is running', timestamp: new Date().toISOString() });
});

// Generic Riot proxy — forwards any path to the right Riot host
app.get('/riot/:region/*', async (req, res) => {
  const { region } = req.params;
  const path = req.params[0];
  const query = new URLSearchParams(req.query).toString();

  const hostMap = {
    americas: 'americas.api.riotgames.com',
    na1:      'na1.api.riotgames.com',
    euw1:     'euw1.api.riotgames.com',
    eun1:     'eun1.api.riotgames.com',
    kr:       'kr.api.riotgames.com',
    br1:      'br1.api.riotgames.com',
    la1:      'la1.api.riotgames.com',
    la2:      'la2.api.riotgames.com',
    oc1:      'oc1.api.riotgames.com',
    tr1:      'tr1.api.riotgames.com',
    ru:       'ru.api.riotgames.com',
  };

  const host = hostMap[region];
  if (!host) return res.status(400).json({ error: `Unknown region: ${region}` });

  const url = `https://${host}/${path}${query ? '?' + query : ''}`;

  try {
    const response = await fetch(url, {
      headers: { 'X-Riot-Token': RIOT_KEY }
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Rift Coach proxy running on port ${PORT}`);
});
