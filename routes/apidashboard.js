const express = require('express');
const Redis=require('ioredis');
const redis=new Redis(process.env.REDIS_URL);
const router = express.Router();
const session = require('express-session');
const {ensureAuthapi}=require('../middleware/apiauth');
const User=require('../store/User');
const story=require('../store/story');


//dashboard page    
router.get('/',ensureAuthapi,async (req,res)=>{
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
            return  res.json({
                name: req.user.displayName,
                stories,
            });
        }
        const stories=await story.find({user:req.user.id}).lean();
        res.json({
            name: req.user.displayName,
            stories,
        });
    } catch(err){
        console.error(err);
        res.status(500).json({message:"Server Error"});
    }
});

module.exports = router;