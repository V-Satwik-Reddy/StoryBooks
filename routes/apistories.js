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
        const {title,description,status}=req.body;
        
        const newStory={
            title,
            body:description,
            status,
            user:req.user.id
        };
        const stori=await story.create(newStory);
        await redis.hset(req.user.email,stori._id,JSON.stringify(req.body));
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
            await redis.hset("public",req.params.id,JSON.stringify(stories));
            return res.json({ message:"from redis",stories });
        }else{
            storykeys=await redis.hget(req.user.email,req.params.id);
            if(storykeys){
                let stories=JSON.parse(storykeys);
                stories.views++;
                await redis.hset(req.user.email,req.params.id,JSON.stringify(stories));
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
            return res.json({message:"from mongodb", stories });
        }
        if (stories.user._id.toString() !== req.user.id) {
            return res.status(404).json({message:"Not Authorized"});
        }
        await story.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });
        await redis.hset("public",req.params.id,JSON.stringify(stories));
        await redis.hset(req.user.email,req.params.id,JSON.stringify(stories));
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
      let stories = await story.findById(req.params.id).lean()
  
      if (!stories) {
        return res.render('error/404')
      }
  
      if (stories.user != req.user.id) {
        res.redirect('/stories')
      } else {
        await story.deleteOne({ _id: req.params.id })
        res.redirect('/dashboard')
      }
    } catch (err) {
      console.error(err)
      return res.render('error/500')
    }
  })
module.exports = router;