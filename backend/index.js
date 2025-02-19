const express = require("express");

const app = express();

const cors = require("cors");
require("dotenv").config();
const PORT = process.env.PORT || 3000;

app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const mainRouter = require("./routes/index");
app.use("/api/v1", mainRouter);

app.listen(PORT, () => {
  console.log("server is running ");
});
