const express = require('express');
const router = express.Router();
const {ensureAuthapi} = require('../middleware/apiauth');
const story = require('../store/story');
const User = require('../store/User');
const Redis=require('ioredis');
const redis=new Redis(process.env.REDIS_URL);
const cron = require('node-cron');
const Story = require('../store/story'); 

cron.schedule('*/5 * * * *', async () => {
    try {
        const storyIds = await redis.hkeys("public"); 

        for (const storyId of storyIds) {
            let storyData = await redis.hget("public", storyId);
            if (!storyData) continue;

            let parsedStory = JSON.parse(storyData);
            
            await Story.findByIdAndUpdate(storyId, {
                likes: parsedStory.likes,
                dislikes: parsedStory.dislikes,
                comments: parsedStory.comments
            });
        }

        console.log("✅ Likes, dislikes, and comments synced to MongoDB");
    } catch (err) {
        console.error("❌ Error syncing Redis data to MongoDB:", err);
    }
});


//add
router.post('/add', ensureAuthapi, async (req,res)=>{
    try{
        const {title,description,status}=req.body;
        
        const newStory={
            title,
            body:description,
            status,
            user:req.user.id
        };
        const stori=await story.create(newStory);
        await redis.hset(req.user.email,stori._id,JSON.stringify(req.body));
        await redis.expire(req.user.email,3600);

        res.json({message:"Story Created",storyDetails:stori});
    }catch(err){
        console.error(err);
        res.status(500).send('Server Error');
    }
});

//show the story content or view the story
router.get('/byId/:id', ensureAuthapi, async (req,res)=>{
    try{
        let storykeys=await redis.hget("public",req.params.id);
        if(storykeys &&(JSON.parse(storykeys).status=="public")){
            let stories=JSON.parse(storykeys);
            stories.views++;
            await story.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } }, { new: true });
            await redis.hset("public",req.params.id,JSON.stringify(stories));
            return res.json({ message:"from redis",stories });
        }else{
            storykeys=await redis.hget(req.user.email,req.params.id);
            if(storykeys){
                let stories=JSON.parse(storykeys);
                stories.views++;
                await redis.hset("public",req.params.id,JSON.stringify(stories));
                return res.json({ message:"from redis is users",stories });
            }
        }
        
        let stories = await story.findById(req.params.id)
        .lean()
        .populate('user');

        if (!stories) 
            return res.status(404).json({ message: 'Story not found' });
        if(stories.status=="public"){
            await story.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });
            await redis.hset("public",req.params.id,JSON.stringify(stories));
            await redis.expire("public",3600);
            return res.json({message:"from mongodb", stories });
        }
        if (stories.user._id.toString() !== req.user.id) {
            return res.status(404).json({message:"Not Authorized"});
        }
        await story.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });
        await redis.hset("public",req.params.id,JSON.stringify(stories));
        await redis.expire("public",3600);
        return res.json({message:"from mongodb is user", stories });

    }catch(err){
        console.error(err);
        res.status(500).json({message:"Server Error"});
    }
});


//show edit page
router.get('/edit/:id', ensureAuthapi, async (req,res)=>{
    try{
        const storie =await redis.hget(req.user.email,req.params.id);
        if(storie){
            const stori=req.body;
            await redis.hset(req.user.email,req.params.id,JSON.stringify(stori));
            await redis.hset("public",req.params.id,JSON.stringify(stori));
            await story.findByIdAndUpdate({_id: req.params.id}, req.body,{
                new: true,
                runValidators: true,
            });
            return res.json({message:"Story updated from redis", stori });
        }
        const stories = await story.findOne({
           _id: req.params.id
        }).lean();
    
        if(!stories){
            return res.status(404).json({message:"Story not found"});
        }
    
        if(stories.user != req.user.id){
            res.status(404).json({message:"Not Authorized"});
        }else{
            const stori=req.body;
            await redis.hset(req.user.email,req.params.id,JSON.stringify(stori));
            await redis.hset("public",req.params.id,JSON.stringify(stori));
            await story.findByIdAndUpdate({_id: req.params.id}, req.body,{
                new: true,
                runValidators: true,
            });
            return res.json({message:"from mongodb", stori });
        }
    }catch(err){
        console.error(err);
        return res.render('error/500');
    }
    
});


//delete story
router.delete('/:id', ensureAuthapi, async (req, res) => {
    try {
        const storie=await redis.hget(req.user.email,req.params.id);
        if(storie){
            await redis.hdel(req.user.email,req.params.id);
            await redis.hdel("public",req.params.id);
            await story.deleteOne({ _id: req.params.id });
            return res.json({message:"Story deleted from redis"});
        }
      let stories = await story.findById(req.params.id).lean()
  
      if (!stories) {
        return res.status(404).json({message:"Story not found"});
      }
  
      if (stories.user != req.user.id) {
        return res.status(404).json({message:"Not Authorized"});
      } else {
        await story.deleteOne({ _id: req.params.id })
        return res.json({message:"Story deleted from mongodb"});
      }
    } catch (err) {
      console.error(err)
      return res.status(500).json({message:"Server Error"});
    }
  })


// Show more stories of the same user
router.get('/user/:userId', ensureAuthapi, async (req, res) => {
    try {
        // Check if user stories exist in Redis
        const cachedStories = await redis.hget("public", req.params.userId);
        if (cachedStories) {
            return res.json({ message: "User stories from Redis", stories: JSON.parse(cachedStories) });
        }

        const allStoryKeys = await redis.hkeys("public");
        if (allStoryKeys.length > 0) {
            // Fetch all public stories at once
            const allStories = await redis.hmget("public", allStoryKeys);
            let userStories = allStories
                .map(story => JSON.parse(story))
                .filter(story => story.user === req.params.userId);

            if (userStories.length > 0) {
                await redis.hset("public", req.params.userId, JSON.stringify(userStories));
                return res.json({ message: "User stories from Redis", stories: userStories });
            }
        }

        const stories = await story.find({ user: req.params.userId, status: 'public' })
            .populate('user')
            .lean();

        if (stories.length > 0) {
            await redis.hset("public", req.params.userId, JSON.stringify(stories));
            await redis.expire("public", 3600); // Cache for 1 hour to prevent stale data
        }

        return res.json({ message: "User stories from MongoDB", stories });

    } catch (err) {
        console.error("[Error Fetching User Stories]:", err);
        res.status(500).json({ message: "Server Error" });
    }
});

// Like a story
router.post('/like/:id', ensureAuthapi, async (req, res) => {
    try {
        let storyData = await redis.hget("public", req.params.id);
        let story;

        if (storyData) {
            story = JSON.parse(storyData);
        } else {
            story = await story.findById(req.params.id);
            if (!story) return res.status(404).json({ message: 'Story not found' });
            await redis.hset("public", req.params.id, JSON.stringify(story)); // Store in Redis if not found
        }

        if (!story.likes.includes(req.user.id)) {
            story.likes.push(req.user.id);
            story.dislikes = story.dislikes.filter(userId => userId !== req.user.id);
        } else {
            story.likes = story.likes.filter(userId => userId !== req.user.id);
        }

        await redis.hset("public", req.params.id, JSON.stringify(story)); // Update Redis
        res.json({ message: "Like updated!", likes: story.likes.length, dislikes: story.dislikes.length });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// Dislike a story
router.post('/dislike/:id', ensureAuthapi, async (req, res) => {
    try {
        let storyData = await redis.hget("public", req.params.id);
        let story;

        if (storyData) {
            story = JSON.parse(storyData);
        } else {
            story = await story.findById(req.params.id);
            if (!story) return res.status(404).json({ message: 'Story not found' });
            await redis.hset("public", req.params.id, JSON.stringify(story));
        }

        if (!story.dislikes.includes(req.user.id)) {
            story.dislikes.push(req.user.id);
            story.likes = story.likes.filter(userId => userId !== req.user.id);
        } else {
            story.dislikes = story.dislikes.filter(userId => userId !== req.user.id);
        }

        await redis.hset("public", req.params.id, JSON.stringify(story)); // Update Redis
        res.json({ message: "Dislike updated!", likes: story.likes.length, dislikes: story.dislikes.length });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// Add a comment
router.post('/comment/:id', ensureAuthapi, async (req, res) => {
    try {
        let storyData = await redis.hget("public", req.params.id);
        let story;

        if (storyData) {
            story = JSON.parse(storyData);
        } else {
            story = await story.findById(req.params.id);
            if (!story) return res.status(404).json({ message: 'Story not found' });
            await redis.hset("public", req.params.id, JSON.stringify(story));
        }

        story.comments.push({ user: req.user.id, text: req.body.text });
        await redis.hset("public", req.params.id, JSON.stringify(story)); // Update Redis

        res.json({ message: "Comment added!", comments: story.comments });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});



module.exports = router;