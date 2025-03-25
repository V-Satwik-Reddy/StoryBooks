const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const LocalStrategy = require('passport-local').Strategy;
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../store/User');
const Redis = require('ioredis');

const redisClient = new Redis(process.env.REDIS_URL);

module.exports = function (passport) {
    // Google Strategy
    passport.use(new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: '/auth/google/callback'
        },
        async (accessToken, refreshToken, profile, done) => {
            const newUser = {
                googleId: profile.id,
                email: profile.emails?.[0]?.value,
                displayName: profile.displayName,
                firstName: profile.name.givenName,
                lastName: profile.name.familyName,
                image: profile.photos[0].value
            };
            try {
                let user = await User.findOne({ email: profile.emails?.[0]?.value });
                if (user) {
                    return done(null, user);
                } else {
                    user = await User.create(newUser);
                    return done(null, user);
                }
            } catch (err) {
                return done(err, null);
            }
        }
    ));

    // Local Strategy for Email/Password Login
    passport.use(new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
        try {
            const user = await User.findOne({ email });
            if (!user) {
                return done(null, false, { message: 'Invalid Credentials' });
            }
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return done(null, false, { message: 'Invalid Password' });
            }
            return done(null, user);
        } catch (err) {
            return done(err, null);
        }
    }));

    // Serialize User (Store user ID in session)
    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    // Deserialize User (Fetch from Redis or MongoDB)
    passport.deserializeUser(async (id, done) => {
        try {
            // First, check Redis cache
            const userData = await redisClient.hgetall(`user:${id}`);
            if (userData && Object.keys(userData).length > 0) {
                return done(null, userData);
            }

            // If not in Redis, fetch from MongoDB
            const user = await User.findById(id);
            if (user) {
                await redisClient.hmset(`user:${id}`, {
                    id: user.id,
                    email: user.email,
                    displayName: user.displayName,
                    image: user.image
                });
                await redisClient.expire(`user:${id}`, 86400); // Cache for 1 day
                return done(null, user);
            }

            done(null, false);
        } catch (err) {
            done(err, null);
        }
    });
};
