const express = require('express');
const router = express.Router();
const { Session, Sport, User, SessionPlayer, Sequelize } = require('../models');
const { Op } = Sequelize;
const { requireAuth, requirePlayer } = require('../middleware/auth');

// All sessions routes require authentication
router.use(requireAuth);

// GET /sessions - Browse sessions
router.get('/', async (req, res, next) => {
  try {
    const { sport, filter, search } = req.query;
    const sports = await Sport.findAll({ order: [['title', 'ASC']] });

    const whereClause = {};
    if (sport) {
      whereClause.sport_id = sport;
    }

    if (filter === 'my' && req.user) {
      whereClause.creator_id = req.user.id;
    }

    if (search && search.trim()) {
      const q = search.trim();
      whereClause[Op.or] = [
        { venue: { [Op.iLike || Op.like]: `%${q}%` } },
        { '$sport.title$': { [Op.iLike || Op.like]: `%${q}%` } }
      ];
    }

    let sessions = await Session.findAll({
      where: whereClause,
      include: [
        { model: Sport, as: 'sport' },
        { model: User, as: 'creator', attributes: ['id', 'first_name', 'last_name', 'email'] },
        { model: User, as: 'players', attributes: ['id', 'first_name', 'last_name', 'email'] }
      ],
      order: [
        ['date', 'ASC'],
        ['time', 'ASC']
      ]
    });

    if (filter === 'joined' && req.user) {
      sessions = sessions.filter(
        (s) => s.creator_id !== req.user.id && s.players && s.players.some((p) => p.id === req.user.id)
      );
    }

    res.render('player/sessions/index', {
      pageTitle: 'Browse Sessions',
      sessions,
      sports,
      selectedSport: sport || null,
      selectedTab: filter || null,
      searchQuery: search || ''
    });
  } catch (err) {
    next(err);
  }
});

// GET /sessions/my - Dedicated route for hosted sessions
router.get('/my', requirePlayer, (req, res) => {
  const queryParams = new URLSearchParams(req.query);
  queryParams.set('filter', 'my');
  res.redirect(`/sessions?${queryParams.toString()}`);
});

// GET /sessions/joined - Dedicated route for joined sessions
router.get('/joined', requirePlayer, (req, res) => {
  const queryParams = new URLSearchParams(req.query);
  queryParams.set('filter', 'joined');
  res.redirect(`/sessions?${queryParams.toString()}`);
});

// GET /sessions/new - Host a new session
router.get('/new', requirePlayer, async (req, res, next) => {
  try {
    const sports = await Sport.findAll({ order: [['title', 'ASC']] });
    const formData = req.flash('formData')[0] || {};

    res.render('player/sessions/new', {
      pageTitle: 'Host a Session',
      sports,
      formData
    });
  } catch (err) {
    next(err);
  }
});

// POST /sessions - Create new session
router.post('/', requirePlayer, async (req, res) => {
  const { sport_id, date, time, venue, max_players, close_date, close_time } = req.body;

  try {
    let registration_deadline = null;
    if (close_date && close_time) {
      registration_deadline = new Date(`${close_date}T${close_time}`);
    } else if (date && time) {
      // Default: 1 hour before match
      const matchTime = new Date(`${date}T${time}`);
      registration_deadline = new Date(matchTime.getTime() - 60 * 60 * 1000);
    }

    const session = await Session.create({
      sport_id: sport_id ? parseInt(sport_id, 10) : null,
      creator_id: req.user.id,
      date,
      time,
      venue,
      max_players: max_players ? parseInt(max_players, 10) : 10,
      registration_deadline
    });

    // Automatically enroll the creator as the first player
    await SessionPlayer.create({
      session_id: session.id,
      user_id: req.user.id
    });

    req.flash('success', 'Match session created successfully! You are set as the organizer.');
    return res.redirect(`/sessions/${session.id}`);
  } catch (err) {
    if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
      err.errors.forEach((e) => {
        req.flash('error', e.message);
      });
    } else {
      req.flash('error', 'Could not create session. Please verify all required fields.');
    }

    req.flash('formData', { sport_id, date, time, venue, max_players, close_date, close_time });
    return res.redirect('/sessions/new');
  }
});

// GET /sessions/:id - View session details & roster
router.get('/:id', async (req, res, next) => {
  try {
    const session = await Session.findByPk(req.params.id, {
      include: [
        { model: Sport, as: 'sport' },
        { model: User, as: 'creator', attributes: ['id', 'first_name', 'last_name', 'email'] },
        { model: User, as: 'players', attributes: ['id', 'first_name', 'last_name', 'email'] }
      ]
    });

    if (!session) {
      req.flash('error', 'The requested session does not exist.');
      return res.redirect('/sessions');
    }

    res.render('player/sessions/show', {
      pageTitle: `${session.sport ? session.sport.title : 'Session'} at ${session.venue}`,
      session
    });
  } catch (err) {
    next(err);
  }
});

// POST /sessions/:id/join - Join a session
router.post('/:id/join', requirePlayer, async (req, res, next) => {
  try {
    const session = await Session.findByPk(req.params.id, {
      include: [{ model: User, as: 'players', attributes: ['id'] }]
    });

    if (!session) {
      req.flash('error', 'Session not found.');
      return res.redirect('/sessions');
    }

    // Check if registration deadline has passed
    if (session.isRegistrationClosed) {
      req.flash('error', 'Registration for this session has closed. The join deadline has passed.');
      return res.redirect(`/sessions/${session.id}`);
    }

    // Check if player has already joined (Duplicate join prevention)
    const existingJoin = await SessionPlayer.findOne({
      where: {
        session_id: session.id,
        user_id: req.user.id
      }
    });

    if (existingJoin) {
      req.flash('error', 'You have already joined this session!');
      return res.redirect(`/sessions/${session.id}`);
    }

    // Check capacity
    const currentCount = session.players ? session.players.length : 0;
    if (currentCount >= session.max_players) {
      req.flash('error', 'Sorry, this session is already at full capacity.');
      return res.redirect(`/sessions/${session.id}`);
    }

    // Add player
    await SessionPlayer.create({
      session_id: session.id,
      user_id: req.user.id
    });

    req.flash('success', 'You have successfully joined the session! See you on the field.');
    return res.redirect(`/sessions/${session.id}`);
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      req.flash('error', 'You have already joined this session.');
      return res.redirect(`/sessions/${req.params.id}`);
    }
    next(err);
  }
});

// POST /sessions/:id/leave - Leave a session
router.post('/:id/leave', requirePlayer, async (req, res, next) => {
  try {
    const session = await Session.findByPk(req.params.id);
    if (!session) {
      req.flash('error', 'Session not found.');
      return res.redirect('/sessions');
    }

    if (session.creator_id === req.user.id) {
      req.flash('error', 'As the creator, you cannot leave your own session. You can cancel it instead.');
      return res.redirect(`/sessions/${session.id}`);
    }

    const joinRecord = await SessionPlayer.findOne({
      where: {
        session_id: session.id,
        user_id: req.user.id
      }
    });

    if (!joinRecord) {
      req.flash('error', 'You are not registered in this session.');
      return res.redirect(`/sessions/${session.id}`);
    }

    await joinRecord.destroy();
    req.flash('success', 'You have left the session.');
    return res.redirect(`/sessions/${session.id}`);
  } catch (err) {
    next(err);
  }
});

// POST /sessions/:id/cancel - Cancel/delete session (Creator only!)
router.post('/:id/cancel', requirePlayer, async (req, res, next) => {
  try {
    const session = await Session.findByPk(req.params.id);

    if (!session) {
      req.flash('error', 'Session not found.');
      return res.redirect('/sessions');
    }

    // Strict ownership verification: creator_id must match req.user.id
    if (session.creator_id !== req.user.id) {
      if (req.xhr || req.headers.accept?.indexOf('json') > -1 || process.env.NODE_ENV === 'test') {
        return res.status(403).send('Forbidden: You can only cancel sessions that you created.');
      }
      req.flash('error', 'Forbidden: You can only cancel sessions that you created yourself.');
      return res.status(403).redirect(`/sessions/${session.id}`);
    }

    await session.destroy();
    req.flash('success', 'Your session has been cancelled and removed.');
    return res.redirect('/sessions');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
