const path = require('path');
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const flash = require('connect-flash');
require('dotenv').config();

const app = express();

// Trust reverse proxy (Vercel) for HTTPS cookies & client IP
if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
  app.set('trust proxy', 1);
}

// View Engine Setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Body Parsers
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session Store Configuration
let sessionStore;
if (process.env.NODE_ENV === 'test') {
  sessionStore = new session.MemoryStore();
} else {
  const pgSession = require('connect-pg-simple')(session);
  const sessionConfig = process.env.DATABASE_URL
    ? {
        conObject: {
          connectionString: process.env.DATABASE_URL,
          ssl: { rejectUnauthorized: false }
        },
        createTableIfMissing: true,
        pruneSessionInterval: process.env.VERCEL ? false : 60
      }
    : {
        conObject: {
          user: process.env.DB_USER || 'postgres',
          password: process.env.DB_PASSWORD,
          host: process.env.DB_HOST || '127.0.0.1',
          port: process.env.DB_PORT || 5432,
          database: process.env.DB_NAME || 'sports_scheduler_dev'
        },
        createTableIfMissing: true
      };
  sessionStore = new pgSession(sessionConfig);
}

app.use(
  session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET || 'sports_scheduler_super_secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    }
  })
);

// Flash messages
app.use(flash());

// Passport Initialization
require('./config/passport')(passport);
app.use(passport.initialize());
app.use(passport.session());

// Global template variables middleware
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success');
  res.locals.error_msg = req.flash('error');
  res.locals.currentUser = req.user || null;
  res.locals.currentPath = req.path;
  res.locals.currentUrl = req.originalUrl;
  res.locals.query = req.query || {};
  next();
});

// Routes
app.use('/', require('./routes/index'));
app.use('/', require('./routes/auth'));
app.use('/sports', require('./routes/sports'));
app.use('/sessions', require('./routes/sessions'));
app.use('/reports', require('./routes/reports'));

// 404 Handler
app.use((req, res) => {
  res.status(404).render('404', {
    pageTitle: 'Page Not Found',
    currentUser: req.user || null
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('500', {
    pageTitle: 'Server Error',
    currentUser: req.user || null,
    error: process.env.NODE_ENV === 'development' ? err : null
  });
});

const PORT = process.env.PORT || 3000;

if (require.main === module && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Sports Scheduler server is running on http://localhost:${PORT}`);
  });
}

module.exports = app;
