const express = require('express');
const router = express.Router();
const {ensureAuth,ensureGuest} = require('../middleware/auth');
const {ensureAuthapi,ensureGuestapi} = require('../middleware/auth');
const Redis=require('ioredis');
const redis=new Redis(process.env.REDIS_URL);
const story = require('../store/story');
//login page
router.get('/', ensureGuest, (req,res)=>{
    res.render('Login',{
        layout: 'login',
    });
});

//dashboard page    
router.get('/dashboard',ensureAuth,async (req,res)=>{
    try{
        const storykeys=await redis.hkeys(req.user.email);
        if(storykeys.length>0){
            console.log("from redis",storykeys);
            let stories=[];
            const pipeline=redis.pipeline();
            for(const key of storykeys){
                pipeline.hget(req.user.email,key);
            }
            const result=await pipeline.exec();
            for (const [err, data] of result) {
                if (!err && data) {
                    stories.push(JSON.parse(data));
                }
            }
            return  res.render('dashboard',{
                name: req.user.displayName,
                stories,
            });
        }
        const stories=await story.find({user:req.user.id}).lean();
        res.render('dashboard',{
            name: req.user.displayName,
            stories,
        });
    } catch(err){
        console.error(err);
        res.render('error/500');
    }
});

module.exports = router;