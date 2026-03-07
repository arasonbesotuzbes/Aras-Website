require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

// =============================================
// MIDDLEWARE
// =============================================
app.use(cors({
  origin: '*', // Deploy sonrasi kendi domain'inle degistir
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// =============================================
// SUPABASE
// =============================================
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// =============================================
// SPOTIFY
// =============================================
let cachedSpotifyToken = null;
let tokenExpiry = 0;

async function getSpotifyToken() {
  if (cachedSpotifyToken && Date.now() < tokenExpiry) {
    return cachedSpotifyToken;
  }

  const credentials = Buffer.from(
    `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
  ).toString('base64');

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${credentials}`
    },
    body: `grant_type=refresh_token&refresh_token=${process.env.SPOTIFY_REFRESH_TOKEN}`
  });

  if (!res.ok) throw new Error('Spotify token alinamadi');

  const data = await res.json();
  cachedSpotifyToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
  return cachedSpotifyToken;
}

// GET /api/spotify - Su an calanan sarki
app.get('/api/spotify', async (req, res) => {
  try {
    const token = await getSpotifyToken();

    const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.status === 204) {
      return res.json({ playing: false, message: 'Su anda muzik calmıyor' });
    }

    if (!response.ok) {
      throw new Error(`Spotify API hatasi: ${response.status}`);
    }

    const data = await response.json();

    res.json({
      playing: data.is_playing,
      song: data.item?.name || '',
      artist: data.item?.artists?.map(a => a.name).join(', ') || '',
      album: data.item?.album?.name || '',
      artwork: data.item?.album?.images?.[0]?.url || '',
      url: data.item?.external_urls?.spotify || '',
      progress_ms: data.progress_ms || 0,
      duration_ms: data.item?.duration_ms || 0
    });

  } catch (error) {
    console.error('[Spotify]', error.message);
    res.status(500).json({ error: 'Spotify baglantisi kurulamadi', playing: false });
  }
});

// GET /api/spotify/recent - Son dinlenen sarkilar
app.get('/api/spotify/recent', async (req, res) => {
  try {
    const token = await getSpotifyToken();
    const response = await fetch('https://api.spotify.com/v1/me/player/recently-played?limit=5', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    const tracks = data.items?.map(item => ({
      song: item.track.name,
      artist: item.track.artists.map(a => a.name).join(', '),
      artwork: item.track.album.images?.[0]?.url || '',
      url: item.track.external_urls.spotify,
      played_at: item.played_at
    })) || [];
    res.json(tracks);
  } catch (error) {
    console.error('[Spotify Recent]', error.message);
    res.status(500).json({ error: 'Son dinlenenler alinamadi' });
  }
});

// =============================================
// STEAM
// =============================================

let cachedSteamGames = null;
let steamGamesExpiry = 0;

// GET /api/steam - Sahip olunan oyunlar
app.get('/api/steam', async (req, res) => {
  try {
    if (cachedSteamGames && Date.now() < steamGamesExpiry) {
      return res.json(cachedSteamGames);
    }

    const apiUrl = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${process.env.STEAM_API_KEY}&steamid=${process.env.STEAM_ID}&format=json&include_appinfo=true&include_played_free_games=true`;

    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error('Steam API yanitlamadi');

    const data = await response.json();
    const games = (data.response?.games || [])
      .filter(g => g.playtime_forever > 0)
      .sort((a, b) => b.playtime_forever - a.playtime_forever);

    const resultData = { games, total: games.length };

    // Cache for 10 minutes
    cachedSteamGames = resultData;
    steamGamesExpiry = Date.now() + 10 * 60 * 1000;

    res.json(resultData);

  } catch (error) {
    console.error('[Steam]', error.message);
    res.status(500).json({ error: 'Steam verileri alinamadi' });
  }
});

// GET /api/steam/achievements/:appid - Oyun basarimlari
app.get('/api/steam/achievements/:appid', async (req, res) => {
  try {
    const { appid } = req.params;
    const apiUrl = `https://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v0001/?key=${process.env.STEAM_API_KEY}&steamid=${process.env.STEAM_ID}&appid=${appid}&l=turkish`;

    const response = await fetch(apiUrl);
    const data = await response.json();

    if (!data.playerstats?.success) {
      return res.json({ achievements: [], message: 'Bu oyun icin basarim yok' });
    }

    res.json({
      achievements: data.playerstats.achievements || [],
      gameName: data.playerstats.gameName || ''
    });

  } catch (error) {
    console.error('[Steam Achievements]', error.message);
    res.status(500).json({ error: 'Basarimlar alinamadi' });
  }
});

// =============================================
// BLOG
// =============================================

// GET /api/blog - Tum blog yazilari
app.get('/api/blog', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('[Blog GET]', error.message);
    res.status(500).json({ error: 'Blog yazilari alinamadi' });
  }
});

// POST /api/blog - Yeni yazi ekle (admin)
app.post('/api/blog', async (req, res) => {
  const { password, title, content, full_content, read_time, tags } = req.body;

  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Yetkisiz erisim' });
  }

  if (!title || !content) {
    return res.status(400).json({ error: 'Baslik ve icerik zorunlu' });
  }

  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .insert([{ title, content, full_content: full_content || content, read_time: read_time || '3 dk', tags: tags || [] }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    console.error('[Blog POST]', error.message);
    res.status(500).json({ error: 'Yazi eklenemedi' });
  }
});

// PUT /api/blog/:id - Yazi duzenle (admin)
app.put('/api/blog/:id', async (req, res) => {
  const { password, title, content, full_content, read_time, tags } = req.body;
  const { id } = req.params;

  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Yetkisiz erisim' });
  }

  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .update({ title, content, full_content: full_content || content, read_time: read_time || '3 dk', tags: tags || [] })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('[Blog PUT]', error.message);
    res.status(500).json({ error: 'Yazi guncellenemedi' });
  }
});

// DELETE /api/blog/:id - Yazi sil (admin)
app.delete('/api/blog/:id', async (req, res) => {
  const { password } = req.body;
  const { id } = req.params;

  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Yetkisiz erisim' });
  }

  try {
    const { error } = await supabase
      .from('blog_posts')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.json({ message: 'Yazi silindi' });
  } catch (error) {
    console.error('[Blog DELETE]', error.message);
    res.status(500).json({ error: 'Yazi silinemedi' });
  }
});

// =============================================
// PROJELER
// =============================================

// GET /api/projects - Tum projeler
app.get('/api/projects', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('[Projects GET]', error.message);
    res.status(500).json({ error: 'Projeler alinamadi' });
  }
});

// POST /api/projects - Yeni proje ekle (admin)
app.post('/api/projects', async (req, res) => {
  const { password, ...projectData } = req.body;

  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Yetkisiz erisim' });
  }

  if (!projectData.name) {
    return res.status(400).json({ error: 'Proje adi zorunlu' });
  }

  try {
    const { data, error } = await supabase
      .from('projects')
      .insert([projectData])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    console.error('[Projects POST]', error.message);
    res.status(500).json({ error: 'Proje eklenemedi' });
  }
});

// PUT /api/projects/:id - Proje duzenle (admin)
app.put('/api/projects/:id', async (req, res) => {
  const { password, ...projectData } = req.body;
  const { id } = req.params;

  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Yetkisiz erisim' });
  }

  try {
    const { data, error } = await supabase
      .from('projects')
      .update(projectData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('[Projects PUT]', error.message);
    res.status(500).json({ error: 'Proje guncellenemedi' });
  }
});

// DELETE /api/projects/:id - Proje sil (admin)
app.delete('/api/projects/:id', async (req, res) => {
  const { password } = req.body;
  const { id } = req.params;

  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Yetkisiz erisim' });
  }

  try {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.json({ message: 'Proje silindi' });
  } catch (error) {
    console.error('[Projects DELETE]', error.message);
    res.status(500).json({ error: 'Proje silinemedi' });
  }
});

// =============================================
// ISTATISTIK
// =============================================

// =============================================
// YETENEKLER (SKILLS)
// =============================================

// GET /api/skills - Tum yetenekleri al
app.get('/api/skills', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('skills')
      .select('*')
      .order('category', { ascending: true })
      .order('name', { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('[Skills GET]', error.message);
    res.status(500).json({ error: 'Yetenekler alinamadi' });
  }
});

// POST /api/skills - Yeni yetenek ekle (admin)
app.post('/api/skills', async (req, res) => {
  const { password, ...skillData } = req.body;

  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Yetkisiz erisim' });
  }

  if (!skillData.name || !skillData.category) {
    return res.status(400).json({ error: 'Yetenek adi ve kategori zorunlu' });
  }

  try {
    const { data, error } = await supabase
      .from('skills')
      .insert([skillData])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    console.error('[Skills POST]', error.message);
    res.status(500).json({ error: 'Yetenek eklenemedi' });
  }
});

// PUT /api/skills/:id - Yetenek guncelle (admin)
app.put('/api/skills/:id', async (req, res) => {
  const { password, ...skillData } = req.body;
  const { id } = req.params;

  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Yetkisiz erisim' });
  }

  try {
    const { data, error } = await supabase
      .from('skills')
      .update(skillData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('[Skills PUT]', error.message);
    res.status(500).json({ error: 'Yetenek guncellenemedi' });
  }
});

// DELETE /api/skills/:id - Yetenek sil (admin)
app.delete('/api/skills/:id', async (req, res) => {
  const { password } = req.body;
  const { id } = req.params;

  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Yetkisiz erisim' });
  }

  try {
    const { error } = await supabase
      .from('skills')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.json({ message: 'Yetenek silindi' });
  } catch (error) {
    console.error('[Skills DELETE]', error.message);
    res.status(500).json({ error: 'Yetenek silinemedi' });
  }
});

// ==========================================
// SETTINGS (AYARLAR) ENDPOINTLERI
// ==========================================

// GET /api/settings - Ayarlari al
app.get('/api/settings', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('settings')
      .eq('id', 1)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is not found

    // Default values if table is empty or column missing
    const defaults = {
      hero_titles: ["Aras", "Bir Geliştirici", "Bir Oyuncu", "Bir Hayalperest"],
      hero_font: "JetBrains Mono",
      logo_font: "'Inter', sans-serif"
    };

    if (!data) {
      return res.json(defaults);
    }

    // Merge actual data with defaults for missing columns
    res.json({
      ...defaults,
      ...data
    });
  } catch (error) {
    console.error('[Settings GET]', error.message);
    res.status(500).json({ error: 'Ayarlar alinamadi' });
  }
});

// PUT /api/settings - Ayarlari guncelle (admin)
app.put('/api/settings', async (req, res) => {
  const adminPassword = req.headers['authorization'];
  if (adminPassword !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Yetkisiz erişim' });
  }

  const { hero_titles, hero_font, logo_font } = req.body;
  if (!hero_titles || !Array.isArray(hero_titles) || !hero_font || !logo_font) {
    console.log('[Settings PUT] Eksik parametre:', { hero_titles, hero_font, logo_font });
    return res.status(400).json({ error: 'Eksik veya hatali parametre' });
  }

  try {
    console.log('[Settings PUT] Guncelleniyor:', { hero_titles, hero_font, logo_font });
    const { data, error } = await supabase
      .from('settings')
      .upsert({ id: 1, hero_titles, hero_font, logo_font, updated_at: new Date() })
      .select()
      .single();

    if (error) {
      console.error('[Settings PUT] Supabase Hatasi:', error);
      throw error;
    }

    console.log('[Settings PUT] Basarili:', data);
    res.json(data);
  } catch (error) {
    console.error('[Settings PUT] Genel Hata:', error.message);
    res.status(500).json({ error: 'Ayarlar guncellenemedi: ' + error.message });
  }
});
app.post('/api/stats/visit', async (req, res) => {
  try {
    await supabase.rpc('increment_visits');
    res.json({ message: 'Ziyaret kaydedildi' });
  } catch (error) {
    // Hata olsa bile sessizce devam et
    res.json({ message: 'ok' });
  }
});

// GET /api/stats - Istatistikleri al
app.get('/api/stats', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('stats')
      .select('visits')
      .eq('id', 1)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.json({ visits: 0 });
  }
});

// =============================================
// HEALTH CHECK
// =============================================
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    message: 'Aras Portfolio API calisıyor!',
    version: '1.0.0',
    endpoints: [
      'GET /api/spotify',
      'GET /api/spotify/recent',
      'GET /api/steam',
      'GET /api/steam/achievements/:appid',
      'GET /api/blog',
      'POST /api/blog',
      'PUT /api/blog/:id',
      'DELETE /api/blog/:id',
      'GET /api/projects',
      'POST /api/projects',
      'PUT /api/projects/:id',
      'DELETE /api/projects/:id',
      'GET /api/skills',
      'POST /api/skills',
      'PUT /api/skills/:id',
      'DELETE /api/skills/:id',
      'GET /api/stats',
      'POST /api/stats/visit'
    ]
  });
});

// =============================================
// SUNUCUYU BASLAT
// =============================================
app.listen(PORT, () => {
  console.log(`✅ Aras Portfolio API ${PORT} portunda calisiyor`);
  console.log(`📡 http://localhost:${PORT}`);
});
