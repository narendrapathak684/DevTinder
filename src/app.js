const express = require("express");

const app = express();

app.use("/naren", (req, res) => {
  res.send("hello i am narendra pathak");
});

app.listen(4545);
