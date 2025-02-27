const mongoose = require("mongoose");

require("dotenv").config();
mongoose
  .connect(process.env.DB_URL)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err.message));

const paytmUserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "This can't be blank"],
      unique: true,

      minLength: 5,
      maxLength: 25,
      trim: true,
      lowercase: true,
      index: true,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
      maxLength: 20,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      maxLength: 20,
    },
    password: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const accountSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  balance: {
    type: Number,
    required: true,
  },
});

const Account = mongoose.model("Account", accountSchema);

const User = mongoose.model("User", paytmUserSchema);

module.exports = {
  User,
  Account,
};
