const express = require('express');
const cors = require('cors');

const server = express();
server.use(cors());

server.get('/server/:id', (req, res) => {
  try {
    const rawId = req.params.id;
    const match = rawId.match(/\d+/);
    const episodeNum = match ? match[0] : "1";

    const sub = [
      { server: "megacloud", id: `${episodeNum}-sub-1`, srcId: "megacloud", name: "MegaCloud (HD Multi-Track)" },
      { server: "vidstreaming", id: `${episodeNum}-sub-2`, srcId: "vidstreaming", name: "VidStreaming (Fast CDN)" },
      { server: "streamtape", id: `${episodeNum}-sub-3`, srcId: "streamtape", name: "StreamTape (Alternative)" },
      { server: "megaplay", id: `${episodeNum}-sub-4`, srcId: "megaplay", name: "MegaPlay (Direct Embed)" }
    ];

    const dub = [
      { server: "megacloud", id: `${episodeNum}-dub-1`, srcId: "megacloud-dub", name: "MegaCloud (English Dub)" },
      { server: "vidstreaming", id: `${episodeNum}-dub-2`, srcId: "vidstreaming-dub", name: "VidStreaming (English Dub)" }
    ];

    return res.json({ sub, dub });
  } catch (error) {
    console.error('Server Route Error:', error);
    return res.status(500).json({ error: 'Server route failed', details: error.message });
  }
});

module.exports = server;
