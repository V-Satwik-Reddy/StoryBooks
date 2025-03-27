const express = require('express');
const Redis=require('ioredis');
const redis=new Redis(process.env.REDIS_URL);
const router = express.Router();
const {ensureAuthapi}=require('../middleware/apiauth');
const User=require('../store/User');
const story=require('../store/story');


//dashboard page    
router.get('/',ensureAuthapi,async (req,res)=>{
    try{
        const storykeys=await redis.hkeys(req.user.email);
        if(storykeys.length>0){
            console.log("from redis");
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
        await storeUserStoriesInRedis(req.user,stories);
        res.json({
            name: req.user.displayName,
            stories,
        });
    } catch(err){
        console.error(err);
        res.status(500).json({message:"Server Error"});
    }
});

async function storeUserStoriesInRedis(user,stories) {
    const pipeline = redis.pipeline();
    
    for (const story of stories) {
        pipeline.hset(user.email, story._id, JSON.stringify(story));
    }
    
    pipeline.expire(user.email, 3600); // Set expiry correctly
    await pipeline.exec();
}
module.exports = router;