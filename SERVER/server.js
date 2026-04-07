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

// ==================== MULTER CONFIGURATION ====================
// Multer settings for handling file uploads

const storage = multer.diskStorage({
  // diskStorage = save files to hard disk
  
  destination: (req, file, cb) => {
    // destination = where to save the file
    // req = the request object
    // file = info about the uploaded file
    // cb = callback function (call this when done)
    
    cb(null, 'uploads/');
    // Save files to the 'uploads/' folder
    // null = no error
  },
  
  filename: (req, file, cb) => {
    // filename = what to name the file
    
    const uniqueSuffix = Date.now() + '-' + Math.random();
    // Create unique name so files don't overwrite
    // Date.now() = current timestamp (1234567890)
    // Math.random() = random number
    
    cb(null, uniqueSuffix + path.extname(file.originalname));
    // Example result: "1234567890-0.5.mp4"
    // path.extname gets the file extension (.mp4)
  },
});

const upload = multer({
  storage,
  // Use the storage settings we defined above
  
  limits: { fileSize: 500 * 1024 * 1024 },
  // Maximum file size: 500MB
  // 1024 * 1024 = 1MB
  // 500 * 1024 * 1024 = 500MB
  
  fileFilter: (req, file, cb) => {
    // fileFilter = validate the file before saving
    
    const allowedMimes = ['video/mp4', 'video/webm', 'video/mpeg'];
    // Only allow these video types
    
    if (allowedMimes.includes(file.mimetype)) {
      // If file type is allowed
      cb(null, true);
      // null = no error, true = accept file
    } else {
      // If file type is not allowed
      cb(new Error('Invalid file type. Only MP4, WebM, and MPEG allowed.'));
      // Send error message
    }
  },
});

// ==================== SETUP AUTHENTICATION ====================

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
// Secret key for signing tokens
// We'll use this to create and verify login tokens

// ==================== JWT VERIFICATION MIDDLEWARE ====================

const verifyToken = (req, res, next) => {
  // This middleware checks if user is logged in
  
  const token = req.headers.authorization?.split(' ')[1];
  // Get token from Authorization header
  // Example header: "Bearer eyJhbGciOiJIUzI1NiIs..."
  // We split it and get the second part (the actual token)
  // The '?' means "if it exists"
  
  if (!token) {
    // If no token provided
    return res.status(401).json({ message: 'No token provided' });
    // Send error response: 401 = Unauthorized
  }

  try {
    // Try to verify the token
    const decoded = jwt.verify(token, JWT_SECRET);
    // jwt.verify checks if token is valid and not expired
    // decoded = the data inside the token
    // Example decoded: { id: "507f1f77bcf86cd799439011" }
    
    req.userId = decoded.id;
    // Add userId to the request object
    // Now in our routes, we can access req.userId
    
    next();
    // Move to the next middleware/route
  } catch (err) {
    // If token is invalid or expired
    res.status(401).json({ message: 'Invalid token' });
  }
};  
    
