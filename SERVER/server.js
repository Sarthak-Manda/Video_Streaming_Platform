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

const Video = mongoose.model('Video', videoSchema);

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

app.post('/api/auth/register', async (req, res) => {

  try {

    const { username, email , password } = req.body;


    if(!username || !email || !password) {

      return res.status(400).json({ message: 'All fields required'})


    }

    const existingUser = await userSchema.findOne({$or: [{username}, {email}]});

    if(existingUser) {

      return res.status(400).json({message: 'Username or path.extnameail already exists'})
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = new User({


    username,
    email,
    password: hashedPassword,

  })

  await user.save();

  const token = jwt.signjwt.sign({id: user._id}, JWT_SECRET , {expiresIn: '7d'})
    res.status(201).json ({

      message: 'User created succcessfully',
      token,
      user: {id:user._id, username: user.username, email: user.email },
    })
} catch(err){

  res.status(500).json({ message: 'Server error', error: err.message})

}
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'Login successful',
      token,
      user: { 
        id: user._id, 
        username: user.username, 
        email: user.email 
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

app.get('/api/auth/me', verifyToken, async (req, res) => {
  try {
    // Find user by ID attached to request by verifyToken middleware
    // Exclude password field from the result for security
    const user = await User.findById(req.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

app.post('/api/videos/upload', verifyToken, upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { title, description, category } = req.body;

    const video = new Video({
      title: title || 'Untitled Video',
      description: description || '',
      category: category || 'General',
      uploadedBy: req.userId,
      fileUrl: `/uploads/${req.file.filename}`
    });

    await video.save();

    // Populate user details to return a complete video object
    await video.populate('uploadedBy', 'username avatar');

    res.status(201).json({
      message: 'Video uploaded successfully',
      video,
    });
    
  } catch (err) {
    res.status(500).json({ message: 'Upload failed', error: err.message });
  }
});
    
//get all videos
app.get('/api/videos', async (req, res) => {

  try {
    const page = parseInt(req.query.page) || 1;
    const  limit  = 12;

    const skip = (page - 1) * limit;

    const videos = await Video.find({ isPublic: true})

    .populate('uploadedBy', 'username avatar')

    .sort({createdAt: -1})

    .skip(skip)

    .limit(limit);

    const total = await Video.countDocuments({isPublic: true})

    res.json({
      videos,

      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total/limit)
      },
    });
  } catch (err){
    res.status(500).json({message: 'Serve error'})
  }
})

//get single video
app.get('/api/videos/:id', async(req,res) => {

  try{
    const video = await Video.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1} },


      { new: true }
    )
    .populate('uploadedBy', 'username avatar subscribers bio')

    if(!video){
      return res.status(404).json({message: "video not found"})
    }

    res.json(video)
  } catch ( err ){
    res.status(500).json({message: 'Server error'})
  }
})