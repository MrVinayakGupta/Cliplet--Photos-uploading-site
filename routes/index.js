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
  try {
    if (!req.file) {
      return res.status(400).send('No file uploaded.');
    }

    // Find the logged-in user
    const user = await userModel.findOne({ username: req.session.passport.user });

    // Create the post matching your Schema exactly
    const postdata = await postModel.create({
      image: '/images/uploads/' + req.file.filename,
      postTitle: req.body.postTitle,   // Matches HTML name="postTitle"
      postText: req.body.filecaption, // Matches HTML name="filecaption"
      category: req.body.category,    // Matches HTML name="category"
      user: user._id
    });

    // Link post to user and save
    user.posts.push(postdata._id);
    await user.save();

    res.redirect('/profile');
  } catch (err) {
    console.error(err);
    res.status(500).send("Upload failed: " + err.message);
  }
});

// router.post('/upload', isLoggedIn, upload.single('file'), async (req, res, next) => {
//   if (!req.file) {
//     return res.status(400).send('No file uploaded.');
//   }
//   const user = await userModel.findOne({ username: req.session.passport.user });
//   const postdata = await postModel.create({
//     image: '/images/uploads/' + req.file.filename, // Store the relative path to the uploaded image
//     imageText: req.body.filecaption,
//     user: user._id,
//     postTitle: req.body.postTitle,
//     category: req.body.category
//   });
//   user.posts.push(postdata._id);
//   await user.save();
//   res.redirect('/profile');
// });

router.get('/upload', isLoggedIn, (req, res) => {
  res.render('upload', { title: 'Upload Image' });
});

router.get('/', async (req, res) => {
  try {
    const posts = await postModel.find().populate('user');
    res.render('home', { title: 'Pinterest Profile', posts, currUser: req.user }); // pass posts and current user to EJS
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

router.get('/profile', isLoggedIn,  async (req, res, next) => {
  const user = await userModel.findOne({ 
    username: req.session.passport.user
   }).populate('posts'); // Populate the 'posts' field with the actual post documents
   const postID = req.params.id; // lowercase for consistency
    const post = await postModel.findById(postID).populate('user');
    res.render('profile', { title: 'Pinterest Profile', user: user, post: post, currUser: user });
});


// Dynamic route for viewing OTHER people's profiles
// Notice we use /user/:profile to prevent clashes with your own /profile route
router.get('/user/:profile', isLoggedIn, async (req, res) => {
    try {
        const targetUsername = req.params.profile;
        const user = await userModel.findOne({ username: targetUsername }).populate('posts');
        const currUser = await userModel.findOne({ username: req.session.passport.user });

        if (!user) return res.status(404).send('User not found');

        res.render('profile', { 
            title: `${user.username}'s Profile`, 
            user, 
            currUser 
        });
    } catch (err) {
        res.status(500).send('Error loading profile');
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

router.get('/follow/:id', isLoggedIn, async (req, res) => {
    try {
        // Use findById and populate if you want to show the names of followers
        const user = await userModel.findById(req.params.id).populate('followers');

        // CRITICAL CHECK: If user is not found, handle it!
        if (!user) {
            return res.status(4404).send("User not found in database");
        }

        res.render('followers', { 
            title: 'Followers', 
            user: user // Passing the found user to EJS
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error"+ err.message);
    }
});

// router.get('/followers/:username', isLoggedIn, async (req, res) => {
//     try {
//         const currentUser = await userModel.findOne({ username: req.session.passport.user });
//         // Use findOne to search by the 'username' field instead of '_id'
//         const user = await userModel.findOne({ username: req.params.username })
//                                     .populate('followers');

//         if (!user) {
//             return res.status(404).send("User not found");
//         }

//         res.render('followers', { 
//             title: 'Followers', 
//             user: user,
//             currUser: currentUser // Pass the current
//         });
//     } catch (err) {
//         console.error(err);
//         res.status(500).send("Server Error: " + err.message);
//     }
// });
router.get('/followers/:username', isLoggedIn, async (req, res) => {
    try {
        const user = await userModel.findOne({ username: req.params.username })
            .populate('followers') // CRITICAL: This fills the 'person' object
            .populate('following');

        const currUser = await userModel.findOne({ username: req.session.passport.user });

        res.render('followers', { user, currUser, title: "Followers" });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// router.get('/following/:username', isLoggedIn, async (req, res) => {
//     try {
//         const currentUser = await userModel.findOne({ username: req.session.passport.user });
//         // Use findOne to search by the 'username' field instead of '_id'
//         const user = await userModel.findOne({ username: req.params.username })
//                                     .populate('following');

//         const targetUserId = user._id; // Get the target user's ID for the self-follow check
        
//         if (!user) {
//             return res.status(404).send("User not found");
//         }
//         if (currentUser._id.toString() === targetUserId.toString()) {
//             // Optional: Send a flash message or error
//             // req.flash('error', 'You cannot follow yourself.');
//             return res.redirect('back'); 
//         }

//         res.render('following', { 
//             title: 'Following', 
//             user: user,
//             currUser: currentUser // Pass the current
//         });
//     } catch (err) {
//         console.error(err);
//         res.status(500).send("Server Error: " + err.message);
//     }
// });
router.get('/following/:username', isLoggedIn, async (req, res) => {
    try {
        const user = await userModel.findOne({ username: req.params.username })
            .populate('followers') // CRITICAL: This fills the 'person' object
            .populate('following');

        const currUser = await userModel.findOne({ username: req.session.passport.user });

        res.render('following', { user, currUser, title: "Following" });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// --- FOLLOW / UNFOLLOW TOGGLE ---
router.post('/follow/:profile', isLoggedIn, async (req, res) => {
    try {
        const targetUserId = req.params.profile;
        const currentUser = await userModel.findOne({ username: req.session.passport.user });

        // CRITICAL CHECK: Prevent following yourself
        if (currentUser._id.toString() === targetUserId.toString()) {
            console.log("Self-follow blocked");
            return res.redirect('back'); 
        }

        const isFollowing = currentUser.following.includes(targetUserId);

        if (isFollowing) {
            // UNFOLLOW Logic
            await userModel.findByIdAndUpdate(currentUser._id, { $pull: { following: targetUserId } });
            await userModel.findByIdAndUpdate(targetUserId, { $pull: { followers: currentUser._id } });
        } else {
            // FOLLOW Logic
            await userModel.findByIdAndUpdate(currentUser._id, { $addToSet: { following: targetUserId } });
            await userModel.findByIdAndUpdate(targetUserId, { $addToSet: { followers: currentUser._id } });
        }
        res.redirect('back');
    } catch (err) {
        res.status(500).send("Server Error");
    }
});



router.get('/user/:profile/edit', isLoggedIn, async (req, res, next) => {
  const user = await userModel.findOne({ 
    username: req.session.passport.user
   }).populate('posts'); // Populate the 'posts' field with the actual post documents
   res.render('editProfile', { title: 'Edit Profile', user: user });
});

router.get('/user/:profile/:postId', isLoggedIn, async (req, res, next) => {
  try {
    const postID = req.params.postId; // lowercase for consistency
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

// --- DELETE POST ROUTE (Matches your EJS Form Path) ---
router.post('/user/:profile/:postid/delete', isLoggedIn, async (req, res) => {
    try {
        const post = await postModel.findById(req.params.postid);
        const user = await userModel.findOne({ username: req.session.passport.user });

        // Security check: Only the owner can delete
        if (post.user.toString() !== user._id.toString()) {
            return res.status(403).send("Unauthorized");
        }

        // Remove post ID from user's posts array
        await userModel.findByIdAndUpdate(user._id, { $pull: { posts: post._id } });
        // Delete the actual post
        await postModel.findByIdAndDelete(req.params.postid);

        res.redirect('/profile');
    } catch (err) {
        res.status(500).send("Error deleting post");
    }
});

router.get('/api/search', isLoggedIn, async (req, res) => {
    try {
        const query = req.query.q; // Gets search term from URL: /search?q=something
        
        if (!query) return res.redirect('back');

        // 1. Search Users (Matching username or full name)
        const users = await userModel.find({
            $or: [
                { username: { $regex: query, $options: 'i' } },
                { fullName: { $regex: query, $options: 'i' } }
            ]
        }).limit(10); // Limit user results for cleaner UI

        // 2. Search Posts (Matching caption/post text)
        const posts = await postModel.find({
            $or: [
                { postText: { $regex: query, $options: 'i' } },
                { category: { $regex: query, $options: 'i' } }
            ]
        }).populate('user');

        res.render('searchResults', { 
            title: 'searchResults',
            query, 
            users, 
            posts 
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Search error occurred.");
    }
});

// router.get("/api/search", async (req, res) => {
//   try {
//         const { q } = req.query; // Get the search term from URL
//         const user = await userModel.find({ $text: { $search: q } });
//         // "i" makes it case-insensitive
//         const regex = new RegExp(q, 'i'); 

//         // Search in title or location (adjust fields based on your schema)
//         const results = await userModel.find({
//             $or: [
//                 { username: regex },
//                 { name: regex },
//                 { bio: regex }  
//             ]
//         });

//         res.render("searchResults", { results, query: q, user });
//     } catch (err) {
//         console.error(err);
//         res.status(500).send("Search error occurred." + err.message);
//     }
// });

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/login");
}


module.exports = router;