# JTrain

JTrain (stylized J! Train) is a web application for training trivia skills based on the Jeopardy! archives.

This version of JTrain uses AWS infrastructure to validate user identities and query a database through API Gateway to serve clues.

A static version with all clues loaded in-browser is available at https://github.com/Stankevitsch-S/JTrain-Static.

## How to use

This application is hosted on: https://main.dt0k15y7cxk84.amplifyapp.com/

On launch, a Jeopardy! clue from any category will be delivered. Near-miss answers can be seen by clicking "Show Hints", potentially helpful metadata such as Jeopardy! round, value, and show airdate can be seen by clicking "More Info", and the answer can be seen by clicking "Show Answer". Revealing the answer will also allow for a new clue to be loaded.<br>

To filter for specific categories, values, and/or show types, click on customize, select all appropriate filters, and click "Save Changes". 

## Contents

**root**<br>
index.html: Landing page, mainly contains text and bootstrap components to be populated with JavaScript.<br>
app.js: Node.js script to run web server and host static files.<br>
lambda_function.py: Python script running on AWS Lambda to query an AWS RDS instance and interact with API Gateway to return clues.

**static/css**<br>
style.css: User css sheet with small fixes for alignment/clarity.<br>
bootstrap.min.css: Modified bootstrap css for dark theme.<br>

**static/js**<br>
logic.js: User JavaScript functions to load data, populate clue delivery system, and enable customization/filtering of clues.<br>
apigClient.js, /lib: API Gateway SDK to invoke the clue serving API with Cognito credentials.

## Data Preparation

All data cleaning procedures and machine learning models detailed below were written in Python.

All webpages for shows after 2000 were downloaded from J! Archive, and clue, category and show data were parsed using Beautiful Soup. Clue values were taken based on position on the board (ignoring daily doubles). Clues with links to images/video/sound were ignored.

To create categories/subcategories, clustering was performed using sklearn KMeans with 101 clusters and a document containing the Jeopardy! category name, all clues, and all answers. The text was processed using Spacy to remove stopwords, punctuation, and perform lemmatization. As a last preprocessing step, sklearn TfidfVectorizer was used with only unigrams. Following clustering, insignificant clusters were removed and some clusters were merged together. A match metric was created by scaling the distance between a document and its cluster center to a 0-1 scale, where 0 is the document furthest away from the cluster center and 1 being the closest document to the cluster center. This metric was used to separate the clue sets, with a match > 0.6 used for clue set 1, a match > 0.4 used for clue set 2, and remaining categories used for clue set 3.

To find near-miss answers, a gensim Doc2Vec model was trained on documents containing a clue, its Jeopardy! category, and its answer. After training, the model looked to find the most similar documents to 1. a vector built from the document itself and 2. a vector built from just the answer. From a similar document, the answer was used as a near-miss as long as it is not contained within the clue text, clue answer, or other near-misses (this will break if a clue consists of multiple-choice options for contestants to choose from, however this only occurs in less than 0.1% of clues). 

Finally, some data modelling was performed to reduce overall file sizes. To see the jupyter notebook files used to create the data sets along with the data itself, refer to the [Data Preparation](https://github.com/Stankevitsch-S/JTrain-Static/tree/main/Data%20Preparation) and [Data](https://github.com/Stankevitsch-S/JTrain-Static/tree/main/Data) folders of the JTrain-Static repository.

## AWS Integration

When the application is loaded, a Cognito identity is generated alongside temporary credentials used to access the API for delivering clue data. The API is called once on application load with default clue filters and customization settings, then any time either the "New Clue" or "Save Changes" (with different clue filters) buttons are clicked, where filters and settings are taken from the "Customization" modal form. The API is configured using AWS API Gateway to trigger an AWS Lambda function, the code of which can be seen in lambda_function.py. This function uses SQLAlchemy to query an AWS RDS instance and return a random clue, its corresponding category and metadata, along with a count of clues available at the current filters. If the API detects expired credentials, it returns an appropriate message which will trigger an event to refresh credentials and try the API call again.

## To do

1. Create a clue queue to allow users to backtrack on clues. (This should only require some changes to logic.js)

2. Track progress by category/value to numerically show areas of improvement. (Will likely use Cognito authentication and DynamoDB to store preferences+progress)

3. Build visualizations for users based on the data gathered above. (Will likely use Chart.js or Plotly)

## Credits

Special thanks to those maintaining J! Archive for organizing years of Jeopardy! data.<br>
The Jeopardy! name and all elements are property of Jeopardy Productions, Inc. J! Train is not affiliated with Jeopardy Productions, Inc.

## Feedback/Contributions

Any suggestions or bug reports would be greatly appreciated, feel free to contact me at [sstankevitsch@gmail.com](mailto:sstankevitsch@gmail.com?subject=JTrain%20Feedback)
