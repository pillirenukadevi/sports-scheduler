const express = require('express');
const router = express.Router();
const { Sport, Session } = require('../models');
const { requireAdmin } = require('../middleware/auth');

// All sports routes require Administrator role
router.use(requireAdmin);

// GET /sports - List all sports
router.get('/', async (req, res, next) => {
  try {
    const sports = await Sport.findAll({
      include: [
        {
          model: Session,
          as: 'sessions',
          attributes: ['id']
        }
      ],
      order: [['title', 'ASC']]
    });

    res.render('admin/sports/index', {
      pageTitle: 'Sports Management',
      sports
    });
  } catch (err) {
    next(err);
  }
});

// GET /sports/new - Form to create new sport
router.get('/new', (req, res) => {
  const formData = req.flash('formData')[0] || {};
  res.render('admin/sports/new', {
    pageTitle: 'Add New Sport',
    formData
  });
});

// POST /sports - Create sport
router.post('/', async (req, res) => {
  const { title, description } = req.body;

  try {
    const newSport = await Sport.create({
      title,
      description
    });

    req.flash('success', `Sport "${newSport.title}" added successfully!`);
    return res.redirect('/sports');
  } catch (err) {
    if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
      err.errors.forEach((e) => {
        req.flash('error', e.message);
      });
    } else {
      req.flash('error', 'Unable to create sport. Please check your inputs.');
    }

    req.flash('formData', { title, description });
    return res.redirect('/sports/new');
  }
});

// GET /sports/:id/edit - Form to edit sport
router.get('/:id/edit', async (req, res, next) => {
  try {
    const sport = await Sport.findByPk(req.params.id);
    if (!sport) {
      req.flash('error', 'Sport not found.');
      return res.redirect('/sports');
    }

    res.render('admin/sports/edit', {
      pageTitle: `Edit ${sport.title}`,
      sport
    });
  } catch (err) {
    next(err);
  }
});

// POST /sports/:id - Update sport
router.post('/:id', async (req, res, next) => {
  const { title, description } = req.body;

  try {
    const sport = await Sport.findByPk(req.params.id);
    if (!sport) {
      req.flash('error', 'Sport not found.');
      return res.redirect('/sports');
    }

    await sport.update({
      title,
      description
    });

    req.flash('success', `Sport "${sport.title}" updated successfully!`);
    return res.redirect('/sports');
  } catch (err) {
    if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
      err.errors.forEach((e) => {
        req.flash('error', e.message);
      });
    } else {
      req.flash('error', 'Unable to update sport. Please check your inputs.');
    }

    return res.redirect(`/sports/${req.params.id}/edit`);
  }
});

// POST /sports/:id/delete - Delete sport
router.post('/:id/delete', async (req, res, next) => {
  try {
    const sport = await Sport.findByPk(req.params.id);
    if (!sport) {
      req.flash('error', 'Sport not found.');
      return res.redirect('/sports');
    }

    const title = sport.title;
    await sport.destroy();

    req.flash('success', `Sport "${title}" has been deleted.`);
    return res.redirect('/sports');
  } catch (err) {
    req.flash('error', 'Could not delete sport. It may have associated records.');
    return res.redirect('/sports');
  }
});

module.exports = router;
