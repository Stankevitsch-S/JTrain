// Dependencies
const express = require('express');
const cors = require('cors');
const path = require('path');
const shrinkRay = require('shrink-ray-current');

// Initialize express app
const app = express();
const port = process.env.port || 3000;

// Enable cors, load js and css files, compress files
app.use(shrinkRay({useZopfliForGzip:false}));
app.use(cors({origin:'*'}));
app.use(express.static(path.join(__dirname,'dist')));

// Render index.html template
app.get('/',function(req,res){
    res.sendFile(path.join(__dirname,'dist/index.html'));
});

app.listen(process.env.port || port);
console.log(`Listening on port ${port}`)


