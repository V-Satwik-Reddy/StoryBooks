const express = require('express');
const router = express.Router();
const {ensureAuthapi} = require('../middleware/apiauth');
const story = require('../store/story');
const Redis=require('ioredis');
const redis=new Redis(process.env.REDIS_URL);


// Get the stories
router.get('/', ensureAuthapi, async (req, res) => {
    try {
        let sortOption = req.query.sort || 'recent';
        const storykeys = await redis.hkeys("public");

        if (storykeys.length > 0) {
            console.log("from redis");
            let stories = await convertRedisData(storykeys, "public");

            // Ensure stories is not nested inside another array
            if (Array.isArray(stories) && stories.length > 0 && Array.isArray(stories[0])) {
                stories = stories[0]; // Extract inner array
            }

            // Sorting logic
            if (sortOption === 'likes') {
                stories.sort((a, b) => (b.likes.length || 0) - (a.likes.length || 0));
            } else if (sortOption === 'recent') {
                stories.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            } else if (sortOption === 'views') {
                stories.sort((a, b) => (b.views || 0) - (a.views || 0));
            } else if (sortOption === 'trending') {
                let yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);

                let trendingStories = stories.filter(story => new Date(story.createdAt) >= yesterday);
                trendingStories.sort((a, b) => (b.likes.length || 0) - (a.likes.length || 0));
                return res.json({  message:"from redis",stories: trendingStories });
            }

            return res.json({ message:"from redis",stories });
        }

        // If no stories in Redis, fetch from MongoDB
        let sortQuery = {};
        if (sortOption === 'likes') {
            sortQuery = { likes: -1 };
        } else if (sortOption === 'recent') {
            sortQuery = { createdAt: -1 };
        } else if (sortOption === 'views') {
            sortQuery = { views: -1 };
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

            return res.json({ message:"from mongodb",stories: trendingStories });
        }
        console.log("from mongodb");
        const stories = await story.find({ status: 'public' })
            .populate('user', 'displayName image')
            .sort(sortQuery)
            .lean();

        // Store in Redis
        const pipeline = redis.pipeline();
        for (const stori of stories) {
            await pipeline.hset("public", stori._id, JSON.stringify(stori));
        }
        await pipeline.expire("public", 3600);
        await pipeline.exec();

        res.json({message:"from mongodb", stories });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});


// Search Stories by Title
router.get('/search', ensureAuthapi, async (req, res) => {
    try {
        let query = req.query.query ? req.query.query.trim().toLowerCase() : null;
        const storykeys = await redis.hkeys("public");

        if (storykeys.length > 0) {
            console.log("from redis");
            let stories = await convertRedisData(storykeys, "public");
            if (Array.isArray(stories) && stories.length > 0 && Array.isArray(stories[0])) {
                stories = stories[0]; // Extract the inner array
            }
            if (!query) {
                return res.json(stories);
            }

            stories = stories.filter(story => story.title && story.title.toLowerCase().includes(query));

            return res.json({message:"from redis", stories });
        }


        if (!query) {
            return res.json(stories) // Redirect if empty search
        }

        const stories = await story.find({
            title: { $regex: query, $options: 'i' }, // Case-insensitive search
            status: 'public',
        })
        .populate('user')
        .lean();

        res.json({
            message:"from mongodb",
            stories,
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});


async function convertRedisData(storykeys,public){
    let stories=[];
    const pipeline=redis.pipeline();
    for(const key of storykeys){
        pipeline.hget(public,key);
    }
    const result=await pipeline.exec();
    for (const [err, data] of result) {
        if (!err && data) {
            stories.push(JSON.parse(data));
        }
    }
    return stories;
}
module.exports = router;