const express = require('express');
const passport = require('passport');
const Redis=require('ioredis');
const redis=new Redis(process.env.REDIS_URL);
const Story=require('../store/story');
const router = express.Router();


//login request to goolge for the user
router.get('/google',passport.authenticate('google',{scope:['profile','email']}));


//google callback responce for the login request   
router.get('/google/callback',passport.authenticate('google',{failureRedirect:'/'}),async (req,res) => {
    const user = req.user;
    const stories=await Story.find({user:req.user.id}).lean();
    const pipeline=redis.pipeline();
    for (const story of stories) {
        pipeline.hset(user.email, `story${story._id}`, JSON.stringify(story));
    }
    pipeline.expire(3600);
    await pipeline.exec();
    res.redirect('/dashboard');
});

//logout
router.get('/logout', async (req, res, next) => {
    await redis.del(req.user.email);
    req.logout(function (err) {
        if (err) {
            return next(err);
        }
        res.redirect('/');
    });
});

module.exports = router;