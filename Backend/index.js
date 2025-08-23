var express = require('express');
var app = express();

app.get("/url", (req, res, next) =>{
    res.json(["example"]);
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
