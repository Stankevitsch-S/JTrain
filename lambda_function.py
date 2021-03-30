# Dependencies.
import json
from sqlalchemy import create_engine
from random import choice
import os

# Reference dictionaries.
labels={"category":{"Business":["Brands","Companies"],"Culture":["Art","Awards","Dance","Events","Fashion","Food & Drink","Museums","Theatre"],"Entertainment":["Games","Internet","Magazines & Newspapers","Movies & Film","Television","The Oscars"],"Geography":["Bodies of Water","Cities","Countries","Islands","Mountains","States"],"History":["Chronology","Famous Women","Monarchies","Ships & Sailors","War"],"Language":["Languages","Letters & Letter Play","Literature","Phrases","Shakespeare","Words & Word Play"],"Music":["Classical Music","Contemporary Music"],"Nature":["Birds","Parks","Pets","Plants","Trees","Zoology"],"Politics":["Government","Law","Presidents","World Leaders"],"Religion":["God & Gods","The Church"],"Science":["Anatomy","Chemistry","Engineering","Health","Measurements","Outer Space","Teeth & Dentistry"],"Sports":["Competition","Teams"],"Other":["Colleges & Universities","Colors","Flags","Hotels","Money","Numbers & Number Play","Stamps"]},"round":{"Jeopardy Round":["200","400","600","800","1000"],"Double Jeopardy Round":["400","800","1200","1600","2000"],"Final Jeopardy Round":["Final Jeopardy","Tiebreaker"]},"showType":{"Regular":["Regular"],"Celebrity":["Celebrity Jeopardy!","Million Dollar Celebrity Invitational","Power Players Week"],"Champions":["All-Star Games","Battle of the Decades","Jeopardy! Greatest of All Time","Million Dollar Masters","The IBM Challenge","Tournament of Champions","Ultimate Tournament of Champions"],"College":["College Championship","Kids Week Reunion"],"Kids":["Back to School Week","Holiday Kids Week","Kids Week"],"Teen":["Teen Tournament","Teen Tournament Summer Games"],"Other":["International Championship","Teachers Tournament"]}}
roundConversion={"Jeopardy Round":1,"Double Jeopardy Round":2,"Final Jeopardy Round":3}
valueConversion={"Final Jeopardy":0,"Tiebreaker":-1,"200":200,"400":400,"600":600,"800":800,"1000":1000,"1200":1200,"1600":1600,"2000":2000}

# Connection string using environment variables.
dbString = "postgresql://{}:{}@{}:{}/{}".format(os.environ['db_user'],os.environ['db_password'],os.environ['db_endpoint'],os.environ['db_port'],os.environ['db_dbname'])

# Connect to the database in Lambda environment.
engine = create_engine(dbString)

def lambda_handler(event,context):
    # Load request data (taken as the body of the API call).
    event = json.loads(event['body'])

    # Process input by whether it affects metadata, category, or clue.
    subcategoriesList = [event[i]['value'] for i in range(len(event)) if event[i]['value'] in [i for sub in labels['category'].values() for i in sub]]
    valueList = [roundConversion[event[i]['name']]+valueConversion[event[i]['value']] for i in range(len(event)) if (event[i]['value'] in [i for sub in labels['round'].values() for i in sub] and event[i]["name"] in labels["round"].keys())]
    showSubTypeList = [event[i]['value'] for i in range(len(event)) if event[i]['value'] in [i for sub in labels['showType'].values() for i in sub]]

    # If any filters return no entries, there will be no resulting clues.
    if (len(subcategoriesList)==0 or len(valueList)==0 or len(showSubTypeList)==0):
        return {
            "statusCode": 200,
            "headers": {
            "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
            "Access-Control-Allow-Credentials": True
            },
            "body": json.dumps({"count":0})
        }

    # Process input to determine which clue set to use.
    clueSet = int([event[i]['value'] for i in range(len(event)) if event[i]['name'] == 'clueSet'][0])

    # Build up final query for clues.
    clueQueryComponents = []

    # Determine whether a show type filter is needed, include it in the final query for clues.
    if len(showSubTypeList) != len([i for sub in labels['showType'].values() for i in sub]):
        showQueryValues = ','.join(f"('{i}')" for i in showSubTypeList)
        filteredShowIDs = [r[0] for r in engine.execute('SELECT showid FROM metadata WHERE showsubtype = ANY(VALUES '+showQueryValues+')')]
        clueQueryValues1 = ','.join(f'({i})' for i in filteredShowIDs)
        clueQueryComponents.append('showid = ANY(VALUES '+clueQueryValues1+')')
    
    # Determine whether a subcategory filter is needed, include it in the final query for clues.
    if len(subcategoriesList) != len([i for sub in labels['category'].values() for i in sub]):
        categoryQueryValues = ','.join(f"('{i}')" for i in subcategoriesList)
        filteredCategoryIDs = [r[0] for r in engine.execute(f'SELECT categoryid FROM category{clueSet} WHERE subcategoryassigned = ANY(VALUES '+categoryQueryValues+')')]
        clueQueryValues2 = ','.join(f'({i})' for i in filteredCategoryIDs)
        clueQueryComponents.append('categoryid = ANY(VALUES '+clueQueryValues2+')')        
    
    # Determine whether a value filter is needed, include it in the final query for clues.
    if len(valueList) != len([i for sub in labels['round'].values() for i in sub]):
        clueQueryValues3 = ','.join(f'({i})' for i in valueList)
        clueQueryComponents.append('newcluevalue = ANY(VALUES '+clueQueryValues3+')')

    # If there are no filters, no need for a "WHERE" statement.
    if len(clueQueryComponents) == 0:
        clueIDResult = [r.clueid for r in engine.execute(f'SELECT clueid FROM clue{clueSet}')]
    # If there were any filters, include the "WHERE".
    else:
        clueQuery = ' AND '.join(clueQueryComponents)
        clueIDResult = [r.clueid for r in engine.execute(f'SELECT clueid FROM clue{clueSet} WHERE '+clueQuery)]
    
    # Using the result of clue ids, extract the count and a random clue.
    randomClueID = choice(clueIDResult)
    randomClue = [dict(r.items()) for r in engine.execute(f'SELECT * FROM clue{clueSet} WHERE clueid = {randomClueID}')][0]

    # Get the random clue's category and show data.
    randomCategory = [dict(r.items()) for r in engine.execute(f"SELECT * FROM category{clueSet} WHERE categoryid = {randomClue['categoryid']}")][0]
    randomMetadata = [dict(r.items()) for r in engine.execute(f"SELECT * FROM metadata WHERE showid = {randomClue['showid']}")][0]
    clueCount = len(clueIDResult)

    return {
        "statusCode": 200,
        "headers": {
        "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
        "Access-Control-Allow-Credentials": True
        },
        "body": json.dumps({"clue":randomClue, "category":randomCategory, "metadata":randomMetadata, "count":clueCount})
    }