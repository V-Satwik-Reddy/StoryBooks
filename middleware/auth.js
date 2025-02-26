const { request } = require("express")

module.exports={
    ensureAuth:function(req,res,next){
        if(req.isAuthenticated()){
            return next()
        }
        res.redirect('/')
    },
    ensureGuest:function(req,res,next){ 
        if(req.isAuthenticated()){
            res.redirect('/dashboard')
        }
        else{
            return next()
        }
    },
}