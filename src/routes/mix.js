const express = require('express');
const cors = require('cors');

const mix = express();
mix.use(cors());

mix.get('/mix/:id/:page?', (req, res) => {
  try {
    const list = [
      { name: "Jujutsu Kaisen", jname: "呪術廻戦", format: "TV", duration: "24m", idanime: "113415", sub: "24", dubani: "24", totalep: "24", img: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx113415-bbBWj4pEFseh.jpg", pg: "PG-13" },
      { name: "Naruto", jname: "NARUTO", format: "TV", duration: "24m", idanime: "20", sub: "220", dubani: "220", totalep: "220", img: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx20-YJvLbgjjdFdn.png", pg: "PG-13" },
      { name: "One Piece", jname: "ONE PIECE", format: "TV", duration: "24m", idanime: "21", sub: "1100", dubani: "1100", totalep: "1100", img: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21-YCDoj1EkAxFn.jpg", pg: "PG-13" }
    ];

    return res.json({ nextpageavailable: false, searchYour: list });
  } catch (error) {
    return res.status(500).json({ error: 'Mix route error', details: error.message });
  }
});

module.exports = mix;
