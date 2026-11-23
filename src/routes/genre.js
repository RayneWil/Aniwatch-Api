const express = require('express');
const axios = require('axios');
const cors = require('cors');

const genre = express();
genre.use(cors());

const ANILIST_URL = 'https://graphql.anilist.co';

genre.get('/genre/:id/:page?', async (req, res) => {
  try {
    const genreName = req.params.id || 'Action';
    const pageNumber = parseInt(req.params.page) || 1;

    const query = `
      query ($genre: String, $page: Int) {
        Page(page: $page, perPage: 20) {
          pageInfo {
            hasNextPage
          }
          media(genre: $genre, type: ANIME, sort: POPULARITY_DESC) {
            id
            title {
              english
              romaji
              native
            }
            coverImage {
              large
            }
            format
            duration
            episodes
            isAdult
          }
        }
      }
    `;

    let genreYour = [];
    let hasNext = false;

    try {
      const response = await axios.post(
        ANILIST_URL,
        { query, variables: { genre: genreName, page: pageNumber } },
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          timeout: 8000
        }
      );

      const pageData = response.data?.data?.Page;
      hasNext = !!pageData?.pageInfo?.hasNextPage;
      const mediaList = pageData?.media || [];

      genreYour = mediaList.map((item) => {
        const title = item.title.english || item.title.romaji;
        const eps = item.episodes ? `${item.episodes}` : '12';
        return {
          name: title,
          jname: item.title.native || title,
          format: item.format || 'TV',
          duration: item.duration ? `${item.duration}m` : '24m',
          idanime: `${item.id}`,
          sub: eps,
          dubani: eps,
          totalep: eps,
          img: item.coverImage?.large,
          pg: item.isAdult ? 'R-18' : 'PG-13'
        };
      });
    } catch (apiErr) {
      console.warn('Genre API notice, using fallback:', apiErr.message);
      genreYour = [
        { name: "Jujutsu Kaisen", jname: "呪術廻戦", format: "TV", duration: "24m", idanime: "113415", sub: "24", dubani: "24", totalep: "24", img: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx113415-bbBWj4pEFseh.jpg", pg: "PG-13" },
        { name: "Demon Slayer", jname: "鬼滅の刃", format: "TV", duration: "24m", idanime: "101922", sub: "26", dubani: "26", totalep: "26", img: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx101922-PEn1CTDYeaRe.jpg", pg: "PG-13" }
      ];
    }

    return res.json({ nextpageavailable: hasNext, genreYour });

  } catch (error) {
    console.error('Genre Route Error:', error);
    return res.status(500).json({ error: 'Genre query failed', details: error.message });
  }
});

module.exports = genre;
