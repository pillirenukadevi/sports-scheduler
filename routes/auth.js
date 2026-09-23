const express = require('express');
const router = express.Router();
const passport = require('passport');
const { User } = require('../models');
const { requireGuest, requireAuth } = require('../middleware/auth');

// GET /signup
router.get('/signup', requireGuest, (req, res) => {
  const formData = req.flash('formData')[0] || {};
  res.render('auth/signup', {
    pageTitle: 'Create Account',
    formData
  });
});

// POST /signup
router.post('/signup', requireGuest, async (req, res, next) => {
  const { first_name, last_name, email, password, role } = req.body;

  try {
    const userRole = role === 'admin' ? 'admin' : 'player';

    // Model validation and creation
    const user = await User.create({
      first_name,
      last_name,
      email,
      password,
      role: userRole
    });

    // Auto-login after successful registration
    req.login(user, (err) => {
      if (err) return next(err);
      req.flash('success', `Welcome to Sports Scheduler, ${user.first_name}!`);
      if (user.role === 'admin') {
        return res.redirect('/sports');
      }
      return res.redirect('/sessions');
    });
  } catch (err) {
    if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
      err.errors.forEach((e) => {
        req.flash('error', e.message);
      });
    } else {
      req.flash('error', 'An unexpected error occurred during signup. Please try again.');
    }

    req.flash('formData', { first_name, last_name, email, role });
    return res.redirect('/signup');
  }
});

// GET /login
router.get('/login', requireGuest, (req, res) => {
  const savedEmail = req.flash('savedEmail')[0] || '';
  res.render('auth/login', {
    pageTitle: 'Sign In',
    savedEmail
  });
});

// POST /login
router.post('/login', requireGuest, (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      req.flash('error', info && info.message ? info.message : 'Invalid email or password.');
      req.flash('savedEmail', req.body.email || '');
      return res.redirect('/login');
    }

    req.login(user, (loginErr) => {
      if (loginErr) {
        return next(loginErr);
      }
      req.flash('success', `Welcome back, ${user.first_name}!`);
      if (user.role === 'admin') {
        return res.redirect('/sports');
      }
      return res.redirect('/sessions');
    });
  })(req, res, next);
});

// GET & POST /logout
const handleLogout = (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.flash('success', 'You have been successfully signed out.');
    res.redirect('/login');
  });
};

router.get('/logout', handleLogout);
router.post('/logout', handleLogout);

module.exports = router;
