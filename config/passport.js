const LocalStrategy = require('passport-local').Strategy;
const { User } = require('../models');

module.exports = function (passport) {
  passport.use(
    new LocalStrategy(
      {
        usernameField: 'email',
        passwordField: 'password'
      },
      async (email, password, done) => {
        try {
          if (!email || !password) {
            return done(null, false, { message: 'Please provide both email and password.' });
          }

          const cleanEmail = email.trim().toLowerCase();
          const user = await User.findOne({ where: { email: cleanEmail } });

          if (!user) {
            return done(null, false, { message: 'Invalid email or password.' });
          }

          const isMatch = user.validPassword(password);
          if (!isMatch) {
            return done(null, false, { message: 'Invalid email or password.' });
          }

          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findByPk(id);
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  });
};
