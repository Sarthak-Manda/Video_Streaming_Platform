const express = require('express');

const mongoose = require('mongoose');

const multer = require('multer');

const cors = require('cors');

const jwt = require('jsonwebtoken');

const bcrypt = require('bcryptjs');

const path = require('path');

const fs = require('fs');

require('dotenv').config();

const app =express();

app.use(cors());

app.use(express.json());

app.use('/uploads', express.static('uploads'));

// ==================== CREATE UPLOADS FOLDER ====================

if (!fs.existsSync('uploads')) {
  // Check if 'uploads' folder exists
  // existsSync returns true if folder exists, false if not
  
  fs.mkdirSync('uploads', { recursive: true });
  // If it doesn't exist, create it
  // { recursive: true } means create parent folders if needed
}

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/myapp', 
    {
        useNewUrlPArser: true,
        useUnifiedTopology: true,
    }
);

// Structure for user data
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  avatar: { type: String, default: null },
  bio: { type: String, default: '' },
  subscribers: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model('User', userSchema);

const videoSchema = new mongoose.Schema({
   
    title: { type: String, required: true },
    description: { type: String, default: '' },

    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' , required: true},

    fileUrl:{ type:String , required: true },

    thumbnail:{ type: String, default: null },

    views: { type: Number, edfault: 0},
    likes: { type: Number, default: 0},
    dislikes: { type: Number, default: 0},

    likedBy: [{type: mongoose.Schema.Types.ObjectId, ref: 'User'}],

    comments:[{
        userId:mongoose.Schema.Types.ObjectId,
        username: String,
        text: String,
        createdAt: { type: Date, default: Date.now},
    }],

    category: {type: String, default: 'General'},
    isPublic: { type: Boolean, default: true},

    createdAt: { type: Date, default: Date.now}

});

const video = mongoose.model('Video', videoSchema);
    
