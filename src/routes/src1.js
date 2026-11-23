const express = require('express');
const cors = require('cors');

const src1 = express();
src1.use(cors());

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

// In-memory cache for playlists (5 min TTL)
const playlistCache = new Map();

async function fetchStreamPlaylist(animeId, ep, lang = 'sub', retry = 0) {
  const cacheKey = `${animeId}_${ep}_${lang}`;
  const cached = playlistCache.get(cacheKey);
  if (cached && Date.now() - cached.time < 300000) {
    return cached.data;
  }

  try {
    const referer = `https://animeembed.com/embed/ani/${animeId}/${ep}?language=${lang}`;
    const htmlRes = await fetch(referer, {
      headers: { 'User-Agent': UA },
      signal: AbortSignal.timeout(8000)
    });
    const htmlText = await htmlRes.text();
    const configMatch = htmlText.match(/<script type="application\/json" id="config">([\s\S]*?)<\/script>/);
    if (!configMatch) throw new Error('Embed config not found');
    const config = JSON.parse(configMatch[1]);

    const srcRes = await fetch(`https://animeembed.com/internal/source?session=${encodeURIComponent(config.session)}&server=1`, {
      headers: { 'User-Agent': UA, 'Referer': referer },
      signal: AbortSignal.timeout(8000)
    });
    const srcData = await srcRes.json();
    if (!srcData.source) throw new Error('Stream source unavailable');

    // Fetch playlist
    const masterRes = await fetch('https://animeembed.com' + srcData.source, {
      headers: { 'User-Agent': UA, 'Referer': referer },
      signal: AbortSignal.timeout(8000)
    });
    const masterText = await masterRes.text();
    if (!masterText.includes('#EXTM3U')) {
      throw new Error('Invalid playlist response: ' + masterText.slice(0, 100));
    }

    let playlistText = masterText;
    if (masterText.includes('#EXT-X-STREAM-INF')) {
      // Multi-variant master playlist: rewrite variants and audio tracks so HLS.js sees all resolutions and audios!
      playlistText = masterText.split('\n').map(line => {
        let trimmed = line.trim();
        trimmed = trimmed.replace(/URI="(\/media\/[^"]+)"/g, (match, p1) => {
          return `URI="/api/hls-variant?path=${encodeURIComponent(p1)}&animeId=${animeId}&ep=${ep}&lang=${lang}"`;
        });
        if (trimmed.startsWith('/media/')) {
          return `/api/hls-variant?path=${encodeURIComponent(trimmed)}&animeId=${animeId}&ep=${ep}&lang=${lang}`;
        }
        return trimmed;
      }).join('\n');
    } else {
      // Single-variant playlist: rewrite directly to media chunks
      playlistText = masterText.split('\n').map(line => {
        let trimmed = line.trim();
        trimmed = trimmed.replace(/URI="(\/media\/[^"]+)"/g, (match, p1) => {
          return `URI="/api/hls-media?path=${encodeURIComponent(p1)}&animeId=${animeId}&ep=${ep}&lang=${lang}"`;
        });
        if (trimmed.startsWith('/media/')) {
          return `/api/hls-media?path=${encodeURIComponent(trimmed)}&animeId=${animeId}&ep=${ep}&lang=${lang}`;
        }
        return trimmed;
      }).join('\n');
    }

    const result = {
      playlist: playlistText,
      tracks: srcData.tracks || [],
      intro: srcData.intro || null,
      outro: srcData.outro || null,
      embedUrl: referer,
      lang: lang
    };

    playlistCache.set(cacheKey, { time: Date.now(), data: result });
    return result;
  } catch (err) {
    if (retry < 1) {
      await new Promise(r => setTimeout(r, 400));
      return fetchStreamPlaylist(animeId, ep, lang, retry + 1);
    }
    throw err;
  }
}

// 1. Direct 100% Ad-Free Native HLS Master Playlist (All Quality Levels: 1080p, 720p, 360p)
src1.get(['/hls-stream/:animeId/:ep.m3u8', '/hls-stream/:animeId/:ep'], async (req, res) => {
  try {
    const animeId = req.params.animeId || '20';
    const ep = (req.params.ep || '1').replace('.m3u8', '');
    const lang = req.query.lang || 'sub';
    const data = await fetchStreamPlaylist(animeId, ep, lang);

    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-cache');
    return res.send(data.playlist);
  } catch (err) {
    console.error('HLS stream error:', err.message);
    res.status(500).setHeader('Content-Type', 'text/plain');
    return res.send('#EXTM3U\n# Error: ' + err.message);
  }
});

// 1.5 High-Speed Variant VOD Playlist (Rewrites Segments to /api/hls-media)
src1.get('/hls-variant', async (req, res) => {
  try {
    const pathParam = req.query.path;
    const animeId = req.query.animeId || '20';
    const ep = req.query.ep || '1';
    const lang = req.query.lang || 'sub';

    if (!pathParam || !pathParam.startsWith('/media/')) {
      return res.status(400).send('Invalid variant path');
    }

    const targetUrl = 'https://animeembed.com' + pathParam;
    const referer = `https://animeembed.com/embed/ani/${animeId}/${ep}?language=${lang}`;

    const varRes = await fetch(targetUrl, {
      headers: { 'User-Agent': UA, 'Referer': referer },
      signal: AbortSignal.timeout(8000)
    });
    const varText = await varRes.text();
    const rewrittenVar = varText.split('\n').map(line => {
      let trimmed = line.trim();
      trimmed = trimmed.replace(/URI="(\/media\/[^"]+)"/g, (match, p1) => {
        return `URI="/api/hls-media?path=${encodeURIComponent(p1)}&animeId=${animeId}&ep=${ep}&lang=${lang}"`;
      });
      if (trimmed.startsWith('/media/')) {
        return `/api/hls-media?path=${encodeURIComponent(trimmed)}&animeId=${animeId}&ep=${ep}&lang=${lang}`;
      }
      return trimmed;
    }).join('\n');

    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-cache');
    return res.send(rewrittenVar);
  } catch (err) {
    return res.status(502).send('Variant error: ' + err.message);
  }
});

// 2. Ultra-Fast Media Segment Streamer (Zero in-memory delay using direct pipeline)
src1.get(['/hls-media', '/media/*'], async (req, res) => {
  try {
    const rawPath = req.query.path || req.path;
    const animeId = req.query.animeId || '20';
    const ep = req.query.ep || '1';
    const lang = req.query.lang || 'sub';

    if (!rawPath || !rawPath.startsWith('/media/')) {
      return res.status(400).send('Invalid path');
    }

    const targetUrl = 'https://animeembed.com' + rawPath;
    const referer = `https://animeembed.com/embed/ani/${animeId}/${ep}?language=${lang}`;

    const proxyRes = await fetch(targetUrl, {
      headers: {
        'User-Agent': UA,
        'Referer': referer
      },
      signal: AbortSignal.timeout(15000)
    });

    if (!proxyRes.ok) {
      return res.status(proxyRes.status).send('Upstream error');
    }

    const cType = proxyRes.headers.get('content-type') || '';
    if (cType.includes('mpegurl') || cType.includes('application/x-mpegURL') || rawPath.endsWith('.m3u8')) {
      const text = await proxyRes.text();
      const rewritten = text.split('\n').map(line => {
        let trimmed = line.trim();
        trimmed = trimmed.replace(/URI="(\/media\/[^"]+)"/g, (m, p1) => `URI="/api/hls-variant?path=${encodeURIComponent(p1)}"`);
        if (trimmed.startsWith('/media/')) {
          return `/api/hls-media?path=${encodeURIComponent(trimmed)}`;
        }
        return trimmed;
      }).join('\n');
      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'no-cache');
      return res.send(rewritten);
    }

    const contentType = cType || (rawPath.includes('.vtt') ? 'text/vtt' : 'video/mp2t');
    res.setHeader('Content-Type', contentType);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=86400');

    const { Readable } = require('stream');
    return Readable.fromWeb(proxyRes.body).pipe(res);
  } catch (err) {
    console.error('Media proxy error:', err.message);
    if (!res.headersSent) {
      return res.status(502).send('Media chunk error: ' + err.message);
    }
  }
});

// 3. Clean Ad-Free & Popup-Free Iframe Player Proxy (Strips abscloud & neutralizes popups)
src1.get('/clean-player', async (req, res) => {
  try {
    const animeId = req.query.id || req.query.animeId || '20';
    const ep = req.query.ep || req.query.episode || '1';
    const lang = req.query.lang || 'sub';
    const targetUrl = `https://animeembed.com/embed/ani/${encodeURIComponent(animeId)}/${encodeURIComponent(ep)}?language=${lang}`;

    const response = await fetch(targetUrl, {
      headers: { 'User-Agent': UA },
      signal: AbortSignal.timeout(8000)
    });
    const rawHtml = await response.text();

    const cleanHtml = rawHtml
      .replace(/<head>/i, `<head>
        <base href="https://animeembed.com/">
        <style>
          .ad-frame, .ad-dialog, .ad-interstitial, iframe[title="Advertisement"] {
            display: none !important;
            visibility: hidden !important;
            pointer-events: none !important;
            width: 0 !important;
            height: 0 !important;
          }
          video::-webkit-media-text-track-container {
            bottom: 5% !important;
            transform: none !important;
          }
          video::cue {
            background: rgba(14, 12, 22, 0.88) !important;
            color: #ffffff !important;
            font-size: clamp(16px, 2.2vw, 24px) !important;
            border-radius: 6px !important;
            padding: 4px 10px !important;
          }
          :fullscreen video::cue {
            font-size: clamp(24px, 2.8vw, 36px) !important;
          }
        </style>
        <script>
          window.open = function() { console.log('[AdBlock] Blocked popup'); return null; };
          window.alert = function() {};
          window.confirm = function() { return false; };
        </script>`)
      .replace(/"adScript"\s*:\s*"[^"]*"/g, '"adScript":""')
      .replace(/<noscript>[\s\S]*?<\/noscript>/gi, '');

    res.setHeader('Content-Type', 'text/html; charset=UTF-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.send(cleanHtml);
  } catch (err) {
    return res.status(500).send('Error loading clean player: ' + err.message);
  }
});

// 4. Primary Sources endpoint: /src-server/:id
src1.get(['/src-server/:id', '/src-server'], async (req, res) => {
  try {
    const rawId = req.params.id || req.query.id || '1';
    const animeId = req.query.animeId || req.query.id || '20';
    const epNum = req.query.ep || req.query.episode || '1';
    const lang = req.query.lang || 'sub';

    let streamInfo = null;
    try {
      streamInfo = await fetchStreamPlaylist(animeId, epNum, lang);
    } catch (e) {
      console.warn('Live stream resolution warning:', e.message);
    }

    const host = req.get('host') || 'aniwatch-api-6ekv.onrender.com';
    const proto = req.protocol === 'https' || host.includes('render.com') ? 'https' : 'http';
    const baseUrl = `${proto}://${host}`;

    const rawTracks = streamInfo && streamInfo.tracks && streamInfo.tracks.length > 0 ? streamInfo.tracks.map(t => ({
      file: `${baseUrl}/api/hls-media?path=${encodeURIComponent(t.file)}&animeId=${animeId}&ep=${epNum}&lang=${lang}`,
      label: t.label || 'English',
      kind: t.kind || 'subtitles'
    })) : [
      {
        file: "https://raw.githubusercontent.com/brouberol/subtitles/master/subtitles.vtt",
        label: "English",
        kind: "captions"
      }
    ];

    const engExact = rawTracks.findIndex(t => t.label && t.label.trim().toLowerCase() === 'english');
    const engPartial = rawTracks.findIndex(t => t.label && t.label.toLowerCase().includes('english'));
    const engIdx = engExact !== -1 ? engExact : (engPartial !== -1 ? engPartial : -1);

    const orderedTracks = [...rawTracks];
    if (engIdx > 0) {
      const [eng] = orderedTracks.splice(engIdx, 1);
      orderedTracks.unshift(eng);
    }

    const finalTracks = orderedTracks.map((t, idx) => ({
      ...t,
      default: idx === 0
    }));

    const restres = {
      tracks: finalTracks,
      intro: streamInfo?.intro || { start: 85, end: 105 },
      outro: streamInfo?.outro || { start: 1320, end: 1410 },
      // Direct 100% Ad-Free Native HLS Stream
      streamUrl: `${baseUrl}/api/hls-stream/${encodeURIComponent(animeId)}/${encodeURIComponent(epNum)}.m3u8?lang=${lang}`,
      sources: [
        {
          url: `${baseUrl}/api/hls-stream/${encodeURIComponent(animeId)}/${encodeURIComponent(epNum)}.m3u8?lang=${lang}`,
          isM3U8: true,
          quality: 'auto (1080p/800p)'
        }
      ],
      // Ad-Free Clean Player URL
      cleanEmbedUrl: `${baseUrl}/api/clean-player?id=${encodeURIComponent(animeId)}&ep=${encodeURIComponent(epNum)}&lang=${lang}`,
      embedUrl: `https://animeembed.com/embed/ani/${encodeURIComponent(animeId)}/${encodeURIComponent(epNum)}?language=${lang}`,
      server: rawId,
      animeId: animeId,
      episode: epNum,
      lang: lang
    };

    return res.json({ restres });

  } catch (error) {
    console.error('Source Route Error:', error);
    return res.status(500).json({ error: 'Source extraction failed', details: error.message });
  }
});

module.exports = src1;
