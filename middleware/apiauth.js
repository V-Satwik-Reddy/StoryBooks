const { request } = require("express")

module.exports={
    ensureAuthapi:function(req,res,next){
        if(req.isAuthenticated()){
            return next()
        }
        res.json({message:"Please Login"})
    },
    ensureGuestapi:function(req,res,next){ 
        if(req.isAuthenticated()){
            res.json({message:"You are already logged in"})
        }
        else{
            return next()
        }
    },
}