const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({    
    googleId: {
        type: String
    },
    email: {
        type: String,
        required: true,
        unique:true,
        index:true
    },
    password: {
        type: String
    },
    displayName: {
        type: String,
        required: true
    },
    firstName: {
        type: String,
    },
    lastName: {
        type: String,
    },
    image:{
        type:String
    },
    bookmarks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Story' }],
    createdAt:{
        type:Date,
        default:Date.now
    }
})

module.exports=mongoose.model('User',UserSchema)