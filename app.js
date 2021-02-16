const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({origin:'*'}));
app.use('/static',express.static(path.join(__dirname,'static')));
app.use('/Data',express.static(path.join(__dirname,'Data')));

app.get('/',function(req,res){
    res.sendFile(path.join(__dirname,'index.html'));
});

app.listen(process.env.port || port);
console.log(`Listening on port ${port}`)


