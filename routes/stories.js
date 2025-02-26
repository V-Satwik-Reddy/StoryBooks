const express = require('express');
const router = express.Router();
const {ensureAuth} = require('../middleware/auth');

const story = require('../store/story');


router.get('/add', ensureAuth, (req,res)=>{
    res.render('stories/add');
});

router.post('/', ensureAuth, async (req,res)=>{
    try{
        req.body.user = req.user.id;
        await story.create(req.body);
        res.redirect('/dashboard');
    }catch(err){
        console.error(err);
        res.render('error/500');
    }
});

// Search Stories by Title
router.get('/search', ensureAuth, async (req, res) => {
    try {
        let query = req.query.query;
        if (!query) {
            return res.redirect('/stories'); // Redirect if empty search
        }

        const stories = await story.find({
            title: { $regex: query, $options: 'i' }, // Case-insensitive search
            status: 'public',
        })
        .populate('user')
        .lean();

        res.render('stories/index', {
            stories,
        });
    } catch (err) {
        console.error(err);
        res.render('error/500');
    }
});


//get the stories
router.get('/', ensureAuth, async (req, res) => {
    try {
        let sortOption = req.query.sort || 'recent';

        let sortQuery = {}; 
        if (sortOption === 'likes') {
            sortQuery = { likes: -1 };
        } else if (sortOption === 'recent') {
            sortQuery = { createdAt: -1 };
        } else if (sortOption === 'views') {
            sortQuery = { views: -1 }; // Most viewed first
        } else if (sortOption === 'trending') {
            let yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);

            const trendingStories = await story.find({
                status: 'public',
                createdAt: { $gte: yesterday },
            })
            .populate('user', 'displayName image')
            .sort({ likes: -1 }) // Sort by most liked
            .lean();

            return res.render('stories/index', { stories: trendingStories });
        }

        const stories = await story.find({ status: 'public' })
            .populate('user', 'displayName image')
            .sort(sortQuery)
            .lean();

        res.render('stories/index', { stories });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});



//show the story content
router.get('/:id', ensureAuth, async (req,res)=>{
    try{
        let stories = await story.findById(req.params.id)
        .lean()
        .populate('user');

        if (!stories) return res.render('error/404');

        await story.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });

        res.render('stories/show', { stories });

    }catch(err){
        console.error(err);
        res.render('error/404');
    }
});

//show edit page
router.get('/edit/:id', ensureAuth, async (req,res)=>{
    try{
        const stories = await story.findOne({
            _id: req.params.id
        }).lean();
    
        if(!stories){
            return res.render('error/404');
        }
    
        if(stories.user != req.user.id){
            res.redirect('/stories');
        }else{
            res.render('stories/edit',{
                stories,
            });
        }
    }catch(err){
        console.error(err);
        return res.render('error/500');
    }
    
});

//update story
router.put('/:id', ensureAuth, async (req,res)=>{
    try{
        let stories = await story.findById(req.params.id).lean();

        if(!stories){
            return res.render('error/404');
        }

        if(stories.user != req.user.id){
            res.redirect('/stories');
        }
        else{
            stories = await story.findByIdAndUpdate({_id: req.params.id}, req.body,{
                new: true,
                runValidators: true,
            });

            res.redirect('/dashboard');
        }
    }catch(err){    
        console.error(err); 
        res.render('error/500');
    }
});

//delete story
router.delete('/:id', ensureAuth, async (req, res) => {
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

//show user stories
router.get('/user/:userId', ensureAuth, async (req,res)=>{
    try{
        const stories = await story.find({
            user: req.params.userId,
            status: 'public'
        })
        .populate('user')
        .lean()
        res.render('stories/index',{
            stories,
        })
    }catch(err){
        console.error(err);
        res.render('error/500');
    }
})

// Like a story
router.post('/like/:id', ensureAuth, async (req, res) => {
    try {
        let story1 = await story.findById(req.params.id);
        if (!story1) return res.status(404).json({ message: 'Story not found' });

        if (!story1.likes.includes(req.user.id)) {
            story1.likes.push(req.user.id);
            story1.dislikes = story1.dislikes.filter(userId => userId.toString() !== req.user.id.toString());
        } else {
            story1.likes = story1.likes.filter(userId => userId.toString() !== req.user.id.toString());
        }

        await story1.save();
        res.json({ likes: story1.likes.length, dislikes: story1.dislikes.length });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// Dislike a story
router.post('/dislike/:id', ensureAuth, async (req, res) => {
    try {
        let story1 = await story.findById(req.params.id);
        if (!story1) return res.status(404).json({ message: 'Story not found' });

        if (!story1.dislikes.includes(req.user.id)) {
            story1.dislikes.push(req.user.id);
            story1.likes = story1.likes.filter(userId => userId.toString() !== req.user.id.toString());
        } else {
            story1.dislikes = story1.dislikes.filter(userId => userId.toString() !== req.user.id.toString());
        }

        await story1.save();
        res.json({ likes: story1.likes.length, dislikes: story1.dislikes.length });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// Add a comment
router.post('/comment/:id', ensureAuth, async (req, res) => {
    try {
        let story1 = await story.findById(req.params.id);
        if (!story1) return res.status(404).json({ message: 'Story not found' });

        story1.comments.push({ user: req.user.id, text: req.body.text });
        await story1.save();
        res.redirect(`/stories/${req.params.id}`);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});



module.exports = router;