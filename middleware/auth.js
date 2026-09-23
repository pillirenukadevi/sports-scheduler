module.exports = {
  // Ensure user is authenticated
  requireAuth: (req, res, next) => {
    if (req.isAuthenticated()) {
      return next();
    }
    req.flash('error', 'You must be signed in to view this page.');
    return res.redirect('/login');
  },

  // Ensure user is NOT authenticated (for login/signup pages)
  requireGuest: (req, res, next) => {
    if (!req.isAuthenticated()) {
      return next();
    }
    if (req.user.role === 'admin') {
      return res.redirect('/sports');
    }
    return res.redirect('/sessions');
  },

  // Ensure user is an Administrator
  requireAdmin: (req, res, next) => {
    if (!req.isAuthenticated()) {
      req.flash('error', 'You must be signed in as an administrator.');
      return res.redirect('/login');
    }
    if (req.user.role !== 'admin') {
      // In testing or API requests, send 403 status code
      if (req.xhr || req.headers.accept?.indexOf('json') > -1 || process.env.NODE_ENV === 'test') {
        return res.status(403).send('Forbidden: Administrator access required');
      }
      req.flash('error', 'Access denied. Administrator privileges are required.');
      return res.status(403).redirect('/sessions');
    }
    return next();
  },

  // Ensure user is a Player
  requirePlayer: (req, res, next) => {
    if (!req.isAuthenticated()) {
      req.flash('error', 'You must be signed in as a player.');
      return res.redirect('/login');
    }
    if (req.user.role !== 'player') {
      // In testing or API requests, send 403 status code
      if (req.xhr || req.headers.accept?.indexOf('json') > -1 || process.env.NODE_ENV === 'test') {
        return res.status(403).send('Forbidden: Player access required');
      }
      req.flash('error', 'Administrators cannot create or join sports sessions.');
      return res.status(403).redirect('/sports');
    }
    return next();
  }
};
