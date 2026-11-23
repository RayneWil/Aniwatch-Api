const express = require('express');
const cors = require('cors');

const random = express();
random.use(cors());

random.get('/random', (req, res) => {
  try {
    const popularPicks = [
      { id: "20", name: "Naruto", jname: "NARUTO", episodes: "220", format: "TV", duration: "24m", img: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx20-YJvLbgjjdFdn.png", desc: "Naruto Uzumaki is a young ninja who seeks recognition from his peers and dreams of becoming the Hokage." },
      { id: "21", name: "One Piece", jname: "ONE PIECE", episodes: "1100", format: "TV", duration: "24m", img: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21-YCDoj1EkAxFn.jpg", desc: "Monkey D. Luffy sails with his crew of Straw Hat Pirates through the Grand Line in search of the world's ultimate treasure." },
      { id: "16498", name: "Attack on Titan", jname: "進撃の巨人", episodes: "25", format: "TV", duration: "24m", img: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx16498-C6FPmWm59CyP.jpg", desc: "Humans fight for survival against giant man-eating humanoids known as Titans." },
      { id: "101922", name: "Demon Slayer", jname: "鬼滅の刃", episodes: "26", format: "TV", duration: "24m", img: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx101922-PEn1CTDYeaRe.jpg", desc: "A young boy becomes a demon slayer after his family is slaughtered and his younger sister is turned into a demon." },
      { id: "5184", name: "Hatsukoi Limited", jname: "初恋限定。", episodes: "12", format: "TV", duration: "24m", img: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx5184-G5Z4Z8HkC9mN.png", desc: "A series of vignettes exploring the romantic lives and first loves of high school and middle school students." }
    ];

    const pick = popularPicks[Math.floor(Math.random() * popularPicks.length)];

    const randomAnime = [
      {
        name: pick.name,
        jname: pick.jname,
        pganime: "PG-13",
        quality: "HD",
        epsub: pick.episodes,
        epdub: pick.episodes,
        totalep: pick.episodes,
        format: pick.format,
        duration: pick.duration,
        desc: pick.desc,
        id: pick.id,
        image: pick.img
      }
    ];

    return res.json({ randomAnime });

  } catch (error) {
    console.error('Random Route Error:', error);
    return res.status(500).json({ error: 'Failed to fetch random anime', details: error.message });
  }
});

module.exports = random;
