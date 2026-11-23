const express = require('express');
const cors = require('cors');

const genre = require('./routes/genre.js');
const info = require('./routes/info.js');
const app = require('./routes/app.js');
const search = require('./routes/search.js');
const random = require('./routes/random.js');
const mix = require('./routes/mix.js');
const episode = require('./routes/episode.js');
const shedule = require('./routes/shedule.js');
const server = require('./routes/server.js');
const src = require('./routes/src1.js');

const inde = express();
const port = process.env.PORT || 3005;

// Middleware
inde.use(cors());
inde.use(express.json());
inde.use(express.urlencoded({ extended: true }));

// API Routes
try {
  inde.use('/api', genre);
  inde.use('/api', info);
  inde.use('/api', app);
  inde.use('/api', search);
  inde.use('/api', random);
  inde.use('/api', mix);
  inde.use('/api', episode);
  inde.use('/api', shedule);
  inde.use('/api', server);
  inde.use('/api', src);

  // Root endpoint
  inde.get('/', (req, res) => {
    res.json({
      status: "ON SERVICE",
      message: "Aniwatch API is Live and Operational!",
      endpoints: {
        search: "/api/search/:keyword or /api/search?q=:keyword",
        parse: "/api/parse (Home trending & popular slides)",
        episode: "/api/episode/:animeId",
        server: "/api/server/:episodeId",
        source: "/api/src-server/:serverId",
        related: "/api/related/:animeId",
        genre: "/api/genre/:genreName",
        random: "/api/random",
        schedule: "/api/shedule"
      }
    });
  });

} catch (error) {
  console.error("Initialization error:", error);
}

// 404 handler
inde.use((req, res) => {
  res.status(404).json({
    error: "Endpoint not found",
    path: req.originalUrl,
    tip: "Visit / to see all available working endpoints."
  });
});

inde.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
