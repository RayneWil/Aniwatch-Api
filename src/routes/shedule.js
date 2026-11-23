const express = require('express');
const cors = require('cors');

const shedule = express();
shedule.use(cors());

shedule.get(['/shedule/:id?', '/shedule', '/schedule/:id?', '/schedule'], (req, res) => {
  try {
    const Sheduletoday = [
      { name: "One Piece", jname: "ONE PIECE", time: "09:30 AM", epshedule: "Episode 1105" },
      { name: "Bleach: Thousand-Year Blood War", jname: "BLEACH 千年血戦篇", time: "11:00 PM", epshedule: "Episode 28" },
      { name: "Blue Lock Season 2", jname: "ブルーロック", time: "06:30 PM", epshedule: "Episode 8" },
      { name: "Dragon Ball Daima", jname: "ドラゴンボールDAIMA", time: "07:00 PM", epshedule: "Episode 7" },
      { name: "Re:ZERO -Starting Life in Another World- Season 3", jname: "Re:ゼロから始める異世界生活", time: "10:30 PM", epshedule: "Episode 8" }
    ];

    return res.json({ Sheduletoday });
  } catch (error) {
    return res.status(500).json({ error: 'Schedule route error', details: error.message });
  }
});

module.exports = shedule;
