const mongoose = require('mongoose');

const StorySchema = new mongoose.Schema({    
    title: {
        type: String,
        required: true,
        trim: true
    },
    body: {
        type: String,
        required: true
    },
    status: {
        type: String,
        default: 'public',
        enum: ['public', 'private']   
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    bookmarks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    likes: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    }],
    dislikes: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    }],
    comments: [
        {
            user: { 
                type: mongoose.Schema.Types.ObjectId, 
                ref: 'User' 
            },
            text: { 
                type: String, 
                required: true 
            },
            createdAt: { 
                type: Date, 
                default: Date.now 
            }
        }
    ],
    views: { type: Number, default: 0 }, 
    

    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Story', StorySchema);
