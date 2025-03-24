const express = require('express');
const passport = require('passport');

const router = express.Router();

//login request to goolge for the user
router.get('/google',passport.authenticate('google',{scope:['profile']}));


//google callback responce for the login request   
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