// Dependencies
const express = require('express');
const cors = require('cors');
const path = require('path');

// Initialize express app
const app = express();
const port = process.env.port || 3000;

// Enable cors, load js and css files
app.use(cors({origin:'*'}));
app.use('/static',express.static(path.join(__dirname,'static')));

// Render index.html template
app.get('/',function(req,res){
    res.sendFile(path.join(__dirname,'index.html'));
});

app.listen(process.env.port || port);
console.log(`Listening on port ${port}`)


