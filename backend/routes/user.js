const express = require("express");
const zod = require("zod");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config");
const { User } = require("../db");
const router = express.Router();
const bcrypt = require("bcrypt");

//Sign-Up code

const signUpBody = zod.object({
  username: zod.string().email(),
  firstName: zod.string(),
  lastName: zod.string(),
  password: zod.string(),
});

router.post("/signup", async (req, res) => {
  const { success, error } = await signUpBody.safeParseAsync(req.body);

  if (!success) {
    res.status(400).json({
      message: error.errors[0].message || "Invalid inputs",
    });
  }

  const existingUser = await User.findOne({
    username: req.body.username,
  });

  if (existingUser) {
    return res.status(400).json({
      message: "Email already taken/Incorrect Inputs",
    });
  }

  const hashedPassword = await bcrypt.hash(req.body.password, 10);

  const user = await User.create({
    username: req.body.username,
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    password: hashedPassword,
  });

  const userId = user._id;
  const token = jwt.sign(
    {
      userId,
    },
    JWT_SECRET
  );

  return res.json({
    message: "user created successfully",
    token: token,
  });
});

//Sign-In code

const signInBody = zod.object({
  username: zod.string().email(),
  password: zod.string(),
});

router.post("/signin", async (req, res) => {
  const { success, error } = await signInBody.safeParseAsync(req.body);

  if (!success) {
    return res.status(400).json({
      message: error.errors[0].message || "Invalid inputs",
    });
  }

  const user = await User.findOne({
    username: req.body.username,
  });

  if (user && (await bcrypt.compare(req.body.password, user.password))) {
    const token = jwt.sign(
      {
        userId: user._id,
      },
      JWT_SECRET
    );

    return res.json({
      message: "Login successful",
      token: token,
    });
  }

  res.status(400).json({
    message: "Error while loggin In",
  });
});
module.exports = router;
