const express = require('express');
const router = express.Router();
const userModel = require('./users');
const postModel = require('./posts');
const imageIds = require('../data/images');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

passport.use(new LocalStrategy(userModel.authenticate()));

const upload = require('./multer');
//handle file upload route
router.post('/upload', isLoggedIn, upload.single('file'), async (req, res, next) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }
  const user = await userModel.findOne({ username: req.session.passport.user });
  const postdata = await postModel.create({
    image: '/images/uploads/' + req.file.filename, // Store the relative path to the uploaded image
    imageText: req.body.filecaption,
    user: user._id
  });
  user.posts.push(postdata._id);
  await user.save();
  res.redirect('/profile');
});

router.get('/upload', isLoggedIn, (req, res) => {
  res.render('upload', { title: 'Upload Image' });
});


router.get('/', async (req, res) => {
  try {
    const posts = await postModel.find().populate('user');
    res.render('home', { title: 'Pinterest Profile', posts });
  } catch (err) {
    res.status(500).send('Error fetching posts');
  }
});



// router.get('/', async (req, res) => {
  
//     const posts = await postModel.find().sort({ createdAt: -1 });
//     res.render('home', {  title: 'Pinterest Profile', posts }); // pass posts to EJS

//   // const posts = postModel.find().populate('image').exec();
//   // res.render('home', {  title: 'Pinterest Home', posts: posts });
// });



router.post('/settings/update', isLoggedIn, async (req, res, next) => {
  const { fullName, bio, title, currentPassword, newPassword } = req.body;
  const user = await userModel.findOne({ username: req.session.passport.user });

  // Update full name if provided
  if (fullName && fullName.trim() !== '') {
    user.fullName = fullName.trim();
  }

  // Update bio if provided
  if (bio && bio.trim() !== '') {
    user.bio = bio.trim();
  }

  // Update title if provided
  if (title && title.trim() !== '') {
    user.title = title.trim();
  }

  // Handle password change if both current and new passwords are provided
  if (currentPassword && newPassword) {
    const isMatch = await user.authenticate(currentPassword);
    if (!isMatch) {
      return res.status(400).send('Current password is incorrect.');
    }
    await user.setPassword(newPassword);
  }

  await user.save();
  res.redirect('/profile');
});

router.get('/settings/delete-account', isLoggedIn, async (req, res, next) => {
  const user = await userModel.findOne({ username: req.session.passport.user });
  await user.remove();
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});

// POST /settings/update   → handle fullName, dp, currentPassword, newPassword
// GET  /settings/delete-account → delete user and logout


router.get('/signup', (req, res) => {
    // We pass the 'imageIds' array to the EJS template under the name 'ids'
    res.render('signup', { ids: imageIds });
});

router.post("/register", (req, res) => {
  const { username, email, fullName, password } = req.body;
  const userData = new userModel({ username, email, fullName });

  userModel.register(userData, password)
    .then(() => {
      passport.authenticate("local")(req, res, function() {
        res.redirect("/profile");
      });
    })
   
});

router.get('/login', (req, res) => {
  console.log(req.flash('error')); // Log the flash message to the console for debugging
    res.render('login', { ids: imageIds, error: req.flash('error') });
});

router.post("/login", passport.authenticate("local", {
  successRedirect: "/profile",
  failureRedirect: "/login",
  failureFlash: true
}), (req, res) => {
  res.render("login", { title: "Login" });
});

router.get("/logout", (req, res) => {
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});


// Dynamic route for viewing OTHER people's profiles
// Notice we use /user/:profile to prevent clashes with your own /profile route
router.get('/user/:profile', isLoggedIn, async (req, res, next) => {
  try {
    // 1. Get the username from the URL (e.g., 'vinayak')
    const targetUsername = req.params.profile; 

    // 2. Use findOne() instead of findById() to search by the username string
    const user = await userModel.findOne({ username: targetUsername }).populate('posts');

    // 3. If no user has that username, show a 404
    if (!user) {
      return res.status(404).send('User not found');
    }

    // 4. Render the profile page with their data
    res.render('profile', { 
        title: `${user.username}'s Profile`, 
        user: user, 
        post: user.posts ,
        currUser: await userModel.findOne({ username: req.session.passport.user }) // Pass the currently logged-in user for conditional rendering
    }); 

  } catch (err) {     
    console.error(err);
    res.status(500).send('Error loading profile: ' + err.message);
  }
});





// router.get('/:profile', isLoggedIn,  async (req, res, next) => {
//   try{
//     const userProfile = req.params.profile; // Get the profile parameter from the URL
//     const user = await userModel.findById(userProfile).populate('posts'); // Populate the 'posts' field with the actual post documents

//     if (!user) {
//       return res.status(404).send('User not found');
//     }

//     res.render('profile', { title: 'Pinterest Profile', user: user, post: user.posts }); // Pass the user and their posts to the profile template
//   }
//   catch (err) {     
//     console.error(err);
//     res.status(500).send('Error loading profile', err.message);
//   }
//   //  const postID = req.params.id; // lowercase for consistency
//   //   const post = await postModel.findById(postID).populate('user');
//   //   res.render('profile', { title: 'Pinterest Profile', user: user, post: post });
// });

router.get('/profile', isLoggedIn,  async (req, res, next) => {
  const user = await userModel.findOne({ 
    username: req.session.passport.user
   }).populate('posts'); // Populate the 'posts' field with the actual post documents
   const postID = req.params.id; // lowercase for consistency
    const post = await postModel.findById(postID).populate('user');
    res.render('profile', { title: 'Pinterest Profile', user: user, post: post, currUser: user });
});
 
router.get('/user/:profile/edit', isLoggedIn, async (req, res, next) => {
  const user = await userModel.findOne({ 
    username: req.session.passport.user
   }).populate('posts'); // Populate the 'posts' field with the actual post documents
   res.render('editProfile', { title: 'Edit Profile', user: user });
});

router.get('/user/:profile/:id', isLoggedIn, async (req, res, next) => {
  try {
    const postID = req.params.id; // lowercase for consistency
    const post = await postModel.findById(postID).populate('user');
    const user = await userModel.findOne({ username: req.session.passport.user });

    if (!post) {
      return res.status(404).send('Post not found');
    }

    res.render('post', { title: 'Pinterest Post', post, currUser: user });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading post', err.message);
  }
});

router.delete('/:id', isLoggedIn, async (req, res, next) => {
  try {
    const postID = req.params.id; // lowercase for consistency
    const post = await postModel.findById(postID);


    // Check if the logged-in user is the owner of the post
    const user = await userModel.findOne({ username: req.session.passport.user });
    if (post.user.toString() !== user._id.toString()) {
      return res.status(403).send('Unauthorized');
    }

    await post.remove();
    res.redirect('/profile');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error deleting post');
  }
});

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/login");
}


module.exports = router;