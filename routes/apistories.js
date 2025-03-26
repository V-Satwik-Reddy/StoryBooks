const express = require('express');
const router = express.Router();
const {ensureAuthapi} = require('../middleware/apiauth');
const story = require('../store/story');
const User = require('../store/User');
const Redis=require('ioredis');
const redis=new Redis(process.env.REDIS_URL);


//add
router.post('/add', ensureAuthapi, async (req,res)=>{
    try{
        req.body.user = req.user.id;
        const stori=await story.create(req.body);
        await redis.hset(req.user.email,`story${stori._id}`,JSON.stringify(req.body));
        res.json({message:"Story Created",storyDetails:stori});
    }catch(err){
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;