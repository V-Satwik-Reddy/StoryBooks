const passport = require('passport');
const GoogleStategy = require('passport-google-oauth20').Strategy;
const mongoose = require('mongoose');  
const User = require('../store/User');
const session = require('express-session');
const RedisStore = require('connect-redis')(session);
const Redis = require('ioredis');

const redisClient = new Redis(process.env.REDIS_URL);
module.exports = function(passport){
    passport.use(new GoogleStategy({
        clientID:process.env.GOOGLE_CLIENT_ID,
        clientSecret:process.env.GOOGLE_CLIENT_SECRET,
        callbackURL:'/auth/google/callback'
    },
    async (accessToken,refreshToken,profile,done) => {
        const newUser ={
            googleId: profile.id,
            email:profile.emails?.[0]?.value,
            displayName: profile.displayName,
            firsdtName: profile.name.givenName,
            lastName: profile.name.familyName,
            image:profile.photos[0].value
        }
        try{
            let user=await User.findOne({email: profile.emails?.[0]?.value})
            if(user){
                done(null, user)
            }
            else{
                user=await User.create(newUser)
                done(null, user)
            }
        }catch(err){
            console.error(err)
        }
    }))
    passport.serializeUser((user, done) => {
        done(null, user.id); // Store user ID in Redis
    });
    
    passport.deserializeUser(async (id, done) => {
        try {
            const userData = await redisClient.hgetall(`user:${id}`); // Fetch from Redis
            if (userData && Object.keys(userData).length > 0) {
                return done(null, userData); // Use Redis-stored session
            }
            const user = await User.findById(id); // Fallback to DB if not in Redis
            if (user) {
                await redisClient.hmset(`user:${id}`, {
                    id: user.id,
                    email: user.email,
                    displayName: user.displayName,
                    image: user.image
                });
                await redisClient.expire(`user:${id}`, 86400); // Expire in 1 day
                return done(null, user);
            }
            done(null, false);
        } catch (err) {
            done(err, null);
        }
    });
    
    
}