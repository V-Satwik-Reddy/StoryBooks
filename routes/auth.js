const express = require('express');
const passport = require('passport');

const router = express.Router();

//login page
router.get('/google',passport.authenticate('google',{scope:['profile']}));


//dashboard page    
router.get('/google/callback',passport.authenticate('google',{failureRedirect:'/'}),(req,res) => {
    res.redirect('/dashboard');
});

//logout
router.get('/logout', (req, res, next) => {
    req.logout(function (err) {
        if (err) {
            return next(err);
        }
        res.redirect('/');
    });
});

module.exports = router;