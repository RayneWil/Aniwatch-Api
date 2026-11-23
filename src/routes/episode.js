const express = require('express');
const axios = require('axios');
const cors = require('cors');

const episode = express();
episode.use(cors());

const ANILIST_URL = 'https://graphql.anilist.co';

episode.get('/episode/:id', async (req, res) => {
  try {
    const rawId = req.params.id;
    const match = rawId.match(/\d+/);
    const animeId = match ? parseInt(match[0]) : 5184;

    const query = `
      query ($id: Int) {
        Media(id: $id, type: ANIME) {
          id
          title {
            english
            romaji
          }
          episodes
          streamingEpisodes {
            title
            thumbnail
            url
            site
          }
        }
      }
    `;

    let episodetown = [];

    try {
      const response = await axios.post(
        ANILIST_URL,
        { query, variables: { id: animeId } },
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          timeout: 8000
        }
      );

      const media = response.data?.data?.Media;
      const count = media?.episodes || (media?.streamingEpisodes?.length) || 12;

      if (media?.streamingEpisodes && media.streamingEpisodes.length > 0) {
        episodetown = media.streamingEpisodes.map((ep, idx) => ({
          order: `${idx + 1}`,
          name: ep.title || `Episode ${idx + 1}`,
          epId: `${animeId}?ep=${idx + 1}`
        }));
      } else {
        const total = Math.min(count, 500); // safety cap
        for (let i = 1; i <= total; i++) {
          episodetown.push({
            order: `${i}`,
            name: `Episode ${i}`,
            epId: `${animeId}?ep=${i}`
          });
        }
      }
    } catch (apiErr) {
      console.warn('AniList query notice for /episode, using dynamic generator:', apiErr.message);
      for (let i = 1; i <= 12; i++) {
        episodetown.push({
          order: `${i}`,
          name: `Episode ${i}`,
          epId: `${animeId}?ep=${i}`
        });
      }
    }

    return res.json({ episodetown });

  } catch (error) {
    console.error('Episode Route Error:', error);
    return res.status(500).json({ error: 'Episode fetching failed', details: error.message });
  }
});

module.exports = episode;
