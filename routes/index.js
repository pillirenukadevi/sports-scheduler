const express = require('express');
const router = express.Router();
const { Sport, Session } = require('../models');

// GET /
router.get('/', async (req, res) => {
  if (req.isAuthenticated()) {
    if (req.user.role === 'admin') {
      return res.redirect('/sports');
    }
    return res.redirect('/sessions');
  }

  // Count active sports and sessions to show stats on landing page
  let sportsCount = 0;
  let sessionsCount = 0;
  try {
    sportsCount = await Sport.count();
    sessionsCount = await Session.count();
  } catch (e) {
    // Graceful fallback if database empty
  }

  res.render('index', {
    pageTitle: 'Home - Sports Scheduler',
    sportsCount,
    sessionsCount
  });
});

// GET /dashboard
router.get('/dashboard', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect('/login');
  }
  if (req.user.role === 'admin') {
    return res.redirect('/sports');
  }
  return res.redirect('/sessions');
});

module.exports = router;
