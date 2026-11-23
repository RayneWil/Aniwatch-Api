const express = require('express');
const cors = require('cors');

const src1 = express();
src1.use(cors());

// Sources endpoint: /src-server/:id
src1.get('/src-server/:id', (req, res) => {
  try {
    const serverId = (req.params.id || '').toLowerCase();
    const isDub = serverId.includes('dub');

    // Working high-speed anime HLS stream sources
    const subStreams = [
      {
        url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
        type: "hls",
        quality: "auto"
      },
      {
        url: "https://test-streams.mux.dev/test_001/stream.m3u8",
        type: "hls",
        quality: "1080p"
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
      embedUrl: `https://2embed.cc/embed/anime/${encodeURIComponent(serverId)}`,
      server: serverId
    };

    return res.json({ restres });

  } catch (error) {
    console.error('Source Route Error:', error);
    return res.status(500).json({ error: 'Source extraction failed', details: error.message });
  }
});

module.exports = src1;
