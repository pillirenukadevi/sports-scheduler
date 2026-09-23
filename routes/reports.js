const express = require('express');
const router = express.Router();
const { Session, Sport, User, SessionPlayer } = require('../models');
const { requireAdmin } = require('../middleware/auth');

// All reports routes require Administrator role
router.use(requireAdmin);

// GET /reports
router.get('/', async (req, res, next) => {
  try {
    const { sport } = req.query;
    const sports = await Sport.findAll({ order: [['title', 'ASC']] });

    const whereClause = {};
    if (sport) {
      whereClause.sport_id = sport;
    }

    const [totalSessions, totalSports, totalJoins] = await Promise.all([
      Session.count(),
      Sport.count(),
      SessionPlayer.count()
    ]);

    const avgPlayers = totalSessions > 0 ? (totalJoins / totalSessions).toFixed(1) : '0.0';

    const sessions = await Session.findAll({
      where: whereClause,
      include: [
        { model: Sport, as: 'sport' },
        { model: User, as: 'creator', attributes: ['id', 'first_name', 'last_name', 'email'] },
        { model: User, as: 'players', attributes: ['id', 'first_name', 'last_name', 'email'] }
      ],
      order: [
        ['date', 'DESC'],
        ['time', 'DESC']
      ]
    });

    res.render('admin/reports', {
      pageTitle: 'Sports & Match Reports',
      sessions,
      sports,
      selectedSport: sport || null,
      totalSessions,
      totalSports,
      totalJoins,
      avgPlayers
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
