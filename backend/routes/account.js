const express = require("express");
const { authMiddleware } = require("../middleware");
const { Account } = require("../db");
const { default: mongoose } = require("mongoose");
const router = express.Router();

router.get("/balance", authMiddleware, async (req, res) => {
  const account = await Account.findOne({
    userId: req.userId,
  });
  res.status(200).json({
    balance: account.balance,
  });
});

router.post("/transfer", authMiddleware, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { amount, to } = req.body;

    const senderAccount = await Account.findOne({ userId: req.userId })
      .session(session)
      .exec();

    if (!senderAccount || senderAccount.balance < amount) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        message: "Insufficient Balance",
      });
    }

    const receiverAccount = await Account.findOne({ userId: to })
      .session(session)
      .exec();

    if (!receiverAccount) {
      await session.abortTransaction();
      session.endSession(); // Close session
      return res.status(400).json({ message: "Invalid account" });
    }

    await Account.updateOne(
      { userId: req.userId },
      { $inc: { balance: -amount } }
    )
      .session(session)
      .exec();

    await Account.updateOne({ userId: to }, { $inc: { balance: +amount } })
      .session(session)
      .exec();

    await session.commitTransaction();
    session.endSession(); //end session after success for not memory leak

    res.json({ message: "Transfer successful" });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ message: "Transfer failed", error: error.message });
  }
});

module.exports = router;
