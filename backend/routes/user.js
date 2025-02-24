const express = require("express");
const zod = require("zod");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config");
const { User } = require("../db");
const router = express.Router();
const bcrypt = require("bcrypt");
const { authMiddleware } = require("../middleware");

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

const updateBody = zod.object({
  password: zod.string().optional(),
  firstName: zod.string().optional(),
  lastName: zod.string().optional(),
});

router.put("/", authMiddleware, async (req, res) => {
  const { success } = await updateBody.safeParseAsync(req.body);
  if (!success) {
    return res.status(411).json({
      message: "Error while updating values",
    });
  }

  await User.updateOne(
    {
      _id: req.userId,
    },
    req.body
  );

  res.json({
    message: "Updated successfully",
  });
});

//GET other users

router.get("/bulk", authMiddleware, async (req, res) => {
  try {
    const filter = req.query.filter || "";

    const query = filter
      ? {
          $or: [
            { firstName: { $regex: filter, $options: "i" } },
            { lastName: { $regex: filter, $options: "i" } },
          ],
        }
      : {}; // If no filter, return all users.

    const users = await User.find(query).select("-password"); //exclude password

    res.status(200).json({
      message: users.length ? "Related Users found" : " no users found",
      users,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching users", error: error.message });
  }
});
module.exports = router;
