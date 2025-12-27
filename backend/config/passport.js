const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const MicrosoftStrategy = require('passport-microsoft').Strategy;
const User = require('../models/User');

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google OAuth Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${process.env.API_URL || 'http://localhost:5000'}/api/auth/google/callback`,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Check if user already exists
          let user = await User.findOne({ googleId: profile.id });

          if (user) {
            return done(null, user);
          }

          // Check if email already exists
          user = await User.findOne({ email: profile.emails[0].value });

          if (user) {
            // Link Google account to existing user
            user.googleId = profile.id;
            await user.save();
            return done(null, user);
          }

          // Create new user
          user = await User.create({
            username: profile.emails[0].value.split('@')[0] + '_' + Date.now(),
            email: profile.emails[0].value,
            googleId: profile.id,
            profilePicture: profile.photos[0]?.value || '',
            isVerified: true, // Email verified by Google
          });

          done(null, user);
        } catch (error) {
          done(error, null);
        }
      }
    )
  );
}

// Microsoft OAuth Strategy  
if (process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET) {
  passport.use(
    new MicrosoftStrategy(
      {
        clientID: process.env.MICROSOFT_CLIENT_ID,
        clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
        callbackURL: `${process.env.API_URL || 'http://localhost:5000'}/api/auth/microsoft/callback`,
        scope: ['user.read'],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Check if user already exists
          let user = await User.findOne({ microsoftId: profile.id });

          if (user) {
            return done(null, user);
          }

          // Check if email already exists
          const email = profile.emails?.[0]?.value || profile.userPrincipalName;
          user = await User.findOne({ email });

          if (user) {
            // Link Microsoft account to existing user
            user.microsoftId = profile.id;
            await user.save();
            return done(null, user);
          }

          // Create new user
          user = await User.create({
            username: (email || 'user').split('@')[0] + '_' + Date.now(),
            email: email,
            microsoftId: profile.id,
            profilePicture: profile.photos?.[0]?.value || '',
            isVerified: true, // Email verified by Microsoft
          });

          done(null, user);
        } catch (error) {
          done(error, null);
        }
      }
    )
  );
}

module.exports = passport;
