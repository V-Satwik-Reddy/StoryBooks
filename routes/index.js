const express = require('express');
const router = express.Router();
const {ensureAuth,ensureGuest} = require('../middleware/auth');

const Story=require('../store/story');
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