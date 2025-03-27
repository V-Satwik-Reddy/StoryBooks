const express = require('express');
const passport = require('passport');
const Redis=require('ioredis');
const redis=new Redis(process.env.REDIS_URL);
const Story=require('../store/story');
const router = express.Router();
const session = require('express-session');
const RedisStore = require('connect-redis')(session);
const redisClient = new Redis(process.env.REDIS_URL);
const {ensureAuthapi,ensureGuestapi} = require('../middleware/apiauth');
const bcrypt=require('bcryptjs');
const User=require('../store/User');
const story=require('../store/story');
//login request to goolge for the user
router.get('/google',passport.authenticate('google',{scope:['profile','email']}));


//google callback responce for the login request   
router.get('/google/callback',passport.authenticate('google',{failureRedirect:'/'}),async (req,res) => {
    const user = req.user;
    storeUserStoriesInRedis(user);

    return res.redirect("/dashboard");
});
// User Signup
router.post("/signup", ensureGuestapi,async (req, res, next) => {
    const { email, password, username } = req.body;

    try {
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: "Email already in use" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        user = await User.create({ email, password: hashedPassword, displayName :username});

        req.login(user, async (err) => {
            if (err) return next(err);

            await storeUserStoriesInRedis(user); // Store user stories in Redis
            return res.json({ message: "User created successfully", user });
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server Error" });
    }
});

//email login
router.post("/login",ensureGuestapi, (req, res, next) => {
    passport.authenticate("local", async (err, user, info) => {
        if (err) return next(err);
        if (!user) return res.json({ message: info.message });

        req.login(user, async (err) => {
            if (err) return next(err);

            await storeUserStoriesInRedis(user); // Store user stories in Redis
            return res.json({message:"User logged in successfully",user:user}); // Redirect after login
        });
    })(req, res, next);
});

//logout
router.get('/logout',ensureAuthapi,async (req, res, next) => {
    await redisClient.del(`user:${req.user.id}`); // Remove user session from Redis
    req.logout(function (err) {
        if (err) return next(err);
        req.session.destroy(() => {
            res.json({ message: "User logged out successfully" });
        });
    });
});


async function storeUserStoriesInRedis(user) {
    const stories = await Story.find({ user: user.id }).lean();
    const pipeline = redis.pipeline();
    
    for (const story of stories) {
        pipeline.hset(user.email, story._id, JSON.stringify(story));
    }
    
    pipeline.expire(user.email, 3600); // Set expiry correctly
    await pipeline.exec();
}
module.exports = router;