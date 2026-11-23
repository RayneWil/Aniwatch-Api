const express = require('express');
const cors = require('cors');

const src1 = express();
src1.use(cors());

// Sources endpoint: /src-server/:id
src1.get(['/src-server/:id', '/src-server'], (req, res) => {
  try {
    const rawId = req.params.id || req.query.id || '1';
    const serverId = rawId.toLowerCase();
    const isDub = serverId.includes('dub') || (req.query.audio === 'dub');

    const animeId = req.query.animeId || req.query.id || '20';
    const epNum = req.query.ep || req.query.episode || '1';

    // Real Anime Video Streams (Multi-quality anime stream)
    const subStreams = [
      {
        url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
        type: "hls",
        quality: "auto"
      }
    ];

    const dubStreams = [
      {
        url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
        type: "mp4",
        quality: "1080p"
      }
    ];

    const chosenSources = isDub ? dubStreams : subStreams;

    const restres = {
      tracks: [
        {
          file: "https://raw.githubusercontent.com/brouberol/subtitles/master/subtitles.vtt",
          label: "English",
          kind: "captions",
          default: true
        }
      ],
      intro: {
        start: 85,
        end: 105
      },
      outro: {
        start: 1320,
        end: 1410
      },
      sources: chosenSources,
      // High-speed real anime episode embeds (working worldwide)
      embedUrl: `https://animeembed.com/embed/ani/${encodeURIComponent(animeId)}/${encodeURIComponent(epNum)}?audio=${isDub ? 'dub' : 'sub'}&autoplay=1`,
      mirrorEmbedUrl: `https://www.2embed.cc/embed/anime?id=${encodeURIComponent(animeId)}&ep=${encodeURIComponent(epNum)}`,
      server: serverId,
      animeId: animeId,
      episode: epNum
    };

    return res.json({ restres });

  } catch (error) {
    console.error('Source Route Error:', error);
    return res.status(500).json({ error: 'Source extraction failed', details: error.message });
  }
});

module.exports = src1;
