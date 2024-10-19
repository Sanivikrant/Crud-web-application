const express = require("express");
const router = express.Router();
const User = require("../models/users");
const multer = require("multer");
const fs = require('fs');

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null,"./uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + "_" + Date.now() + "_" + file.originalname);
  },
});

const upload = multer({
  storage: storage,
}).single('image');

router.post("/add", upload, (req, res) => {
  const user = new User({
    name: req.body.name,
    email: req.body.email,
    phone: req.body.phone,
    image: req.body.image,
  });

  user
    .save()
    .then(() => {
      req.session.message = {
        type: "success",
        message: "User added successfully",
      };
      res.redirect("/");
    })
    .catch((err) => {
      res.json({ message: err.message, type: "danger" });
    });

});



router.get("/", (req, res) => {
  User.find().exec()
  .then(users => {
    res.render('index', {
      title: 'Home Page',
      users: users,
    });
  })
      .catch(err => {
        res.json({ message: err.message });
      });
  });
  
router.get("/add", (req, res) => {
  res.render("add_users", { title: "Add Users" });
});
  
router.get('/edit/:id', async (req, res) => {
  try {
      let id = req.params.id;
      const user = await User.findById(id).exec();

      if (!user) {

          return res.redirect('/');
      }

      res.render('edit_users', {
          title: 'Edit User',
          user: user,
      });
  } catch (err) {
      console.error(err);
      res.redirect('/');
  }
});



  router.post("/update/:id", upload, async (req, res) => {
    try {
        let id = req.params.id;
        let new_image = "";

        if (req.file) {
            new_image = req.file.filename;

            try {

                await fs.promises.unlink("./uploads/" + req.body.old_image);
            } catch (err) {
                console.error(err);
            }
        } else {
            new_image = req.body.old_image;
        }

        const updatedUser = await User.findByIdAndUpdate(
            id,
            {
                name: req.body.name,
                email: req.body.email,
                phone: req.body.phone,
                image: new_image,
            },
            { new: true } 
        ).exec();

        if (!updatedUser) {
            return res.json({ message: 'User not found', type: 'danger' });
        }

        req.session.message = {
            type: 'success',
            message: 'User updated successfully!',
        };
        res.redirect('/');
    } catch (err) {
        console.error(err);
        res.json({ message: err.message, type: 'danger' });
    }
});

router.get('/delete/:id', async (req, res) => {
    try {
        let id = req.params.id;
        const user = await User.findOneAndDelete({ _id: id }).exec();

        if (user && user.image !== '') {
            try {
                await fs.promises.unlink('./uploads/' + user.image);
            } catch (err) {
                console.error(err);
            }
        }

        req.session.message = {
            type: 'info',
            message: 'User deleted successfully!',
        };
        res.redirect('/');
    } catch (err) {
        console.error(err);
        res.json({ message: err.message });
    }
});



module.exports = router;
