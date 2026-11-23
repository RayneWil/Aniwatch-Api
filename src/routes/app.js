const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());

const ANILIST_URL = 'https://graphql.anilist.co';

app.get('/parse', async (req, res) => {
  try {
    const query = `
      query {
        trending: Page(page: 1, perPage: 8) {
          media(type: ANIME, sort: TRENDING_DESC) {
            id
            title {
              romaji
              english
              native
            }
            description
            bannerImage
            coverImage {
              extraLarge
              large
            }
            format
            duration
            seasonYear
          }
        }
        popular: Page(page: 1, perPage: 10) {
          media(type: ANIME, sort: POPULARITY_DESC) {
            id
            title {
              romaji
              english
              native
            }
            coverImage {
              large
            }
          }
        }
        upcoming: Page(page: 1, perPage: 8) {
          media(type: ANIME, status: NOT_YET_RELEASED, sort: POPULARITY_DESC) {
            id
            title {
              romaji
              english
              native
            }
            format
            coverImage {
              large
            }
            startDate {
              year
            }
          }
        }
      }
    `;

    let slides = [];
    let trend = [];
    let UpcomingAnime = [];

    try {
      const response = await axios.post(
        ANILIST_URL,
        { query },
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          timeout: 8000
        }
      );

      const data = response.data?.data;

      if (data?.trending?.media) {
        slides = data.trending.media.map((item, index) => {
          const title = item.title.english || item.title.romaji;
          const cleanDesc = (item.description || '').replace(/<[^>]*>?/gm, '').slice(0, 150) + '...';
          return {
            name: title,
            jname: item.title.native || title,
            spotlight: `#${index + 1} Spotlight`,
            imageAnime: item.bannerImage || item.coverImage?.extraLarge || item.coverImage?.large,
            format: item.format || 'TV',
            duration: item.duration ? `${item.duration}m` : '24m',
            release: item.seasonYear ? `${item.seasonYear}` : '2024',
            quality: 'HD',
            animeId: `${item.id}`,
            anidesc: cleanDesc
          };
        });
      }

      if (data?.popular?.media) {
        trend = data.popular.media.map((item, index) => {
          const title = item.title.english || item.title.romaji;
          return {
            name: title,
            ranking: index < 9 ? `0${index + 1}` : `${index + 1}`,
            imgAni: item.coverImage?.large,
            jname: item.title.native || title,
            iD: `${item.id}`
          };
        });
      }

      if (data?.upcoming?.media) {
        UpcomingAnime = data.upcoming.media.map((item) => {
          const title = item.title.english || item.title.romaji;
          return {
            name: title,
            jname: item.title.native || title,
            format: item.format || 'TV',
            release: item.startDate?.year ? `${item.startDate.year}` : 'Upcoming',
            idani: `${item.id}`,
            imgAnime: item.coverImage?.large
          };
        });
      }

    } catch (apiErr) {
      console.warn('AniList query notice for /parse, using reliable defaults:', apiErr.message);
      // Default high quality slides & trends
      slides = [
        {
          name: "Jujutsu Kaisen",
          jname: "呪術廻戦",
          spotlight: "#1 Spotlight",
          imageAnime: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1200",
          format: "TV",
          duration: "24m",
          release: "2024",
          quality: "HD",
          animeId: "113415",
          anidesc: "A boy swallows a cursed talisman - the demon Sukuna - and becomes cursed himself."
        },
        {
          name: "Demon Slayer",
          jname: "鬼滅の刃",
          spotlight: "#2 Spotlight",
          imageAnime: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1200",
          format: "TV",
          duration: "24m",
          release: "2024",
          quality: "HD",
          animeId: "101922",
          anidesc: "Tanjiro sets out to turn his demon sister back into a human."
        }
      ];

      trend = [
        { name: "One Piece", ranking: "01", imgAni: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21-YCDoj1EkAxFn.jpg", jname: "ONE PIECE", iD: "21" },
        { name: "Naruto", ranking: "02", imgAni: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx20-YJvLbgjjdFdn.png", jname: "NARUTO", iD: "20" },
        { name: "Attack on Titan", ranking: "03", imgAni: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx16498-C6FPmWm59CyP.jpg", jname: "進撃の巨人", iD: "16498" }
      ];

      UpcomingAnime = [
        { name: "Chainsaw Man Movie", jname: "劇場版 チェンソーマン", format: "MOVIE", release: "2025", idani: "171018", imgAnime: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400" }
      ];
    }

    return res.json({ slides, trend, UpcomingAnime });

  } catch (error) {
    console.error('Error parsing route:', error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

module.exports = app;
