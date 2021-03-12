// AWS dependencies and config.
import {CognitoIdentityClient} from "@aws-sdk/client-cognito-identity"
import {fromCognitoIdentityPool} from "@aws-sdk/credential-provider-cognito-identity"
import {default as apigClientFactory} from "aws-api-gateway-client"
const regionAWS = "us-east-2"
const identityPoolIdAWS = "us-east-2:5f1995a6-d8c2-40aa-b0cd-d993cf08f7b0"
const invokeUrlAWS = "https://ys7dxtnbo9.execute-api.us-east-2.amazonaws.com/default"
const cognitoIdentityClient = new CognitoIdentityClient({region: regionAWS})

// Some supplementary data to populate customization fields and handle differences
// between screen names (ex: Jeopardy Round) and underlying data (ex: category[round] of 1).
const labels={"category":{"Business":["Brands","Companies"],"Culture":["Art","Awards","Dance","Events","Fashion","Food & Drink","Museums","Theatre"],"Entertainment":["Games","Internet","Magazines & Newspapers","Movies & Film","Television","The Oscars"],"Geography":["Bodies of Water","Cities","Countries","Islands","Mountains","States"],"History":["Chronology","Famous Women","Monarchies","Ships & Sailors","War"],"Language":["Languages","Letters & Letter Play","Literature","Phrases","Shakespeare","Words & Word Play"],"Music":["Classical Music","Contemporary Music"],"Nature":["Birds","Parks","Pets","Plants","Trees","Zoology"],"Politics":["Government","Law","Presidents","World Leaders"],"Religion":["God & Gods","The Church"],"Science":["Anatomy","Chemistry","Engineering","Health","Measurements","Outer Space","Teeth & Dentistry"],"Sports":["Competition","Teams"],"Other":["Colleges & Universities","Colors","Flags","Hotels","Money","Numbers & Number Play","Stamps"]},"round":{"Jeopardy Round":["200","400","600","800","1000"],"Double Jeopardy Round":["400","800","1200","1600","2000"],"Final Jeopardy Round":["Final Jeopardy","Tiebreaker"]},"showType":{"Regular":["Regular"],"Celebrity":["Celebrity Jeopardy!","Million Dollar Celebrity Invitational","Power Players Week"],"Champions":["All-Star Games","Battle of the Decades","Jeopardy! Greatest of All Time","Million Dollar Masters","The IBM Challenge","Tournament of Champions","Ultimate Tournament of Champions"],"College":["College Championship","Kids Week Reunion"],"Kids":["Back to School Week","Holiday Kids Week","Kids Week"],"Teen":["Teen Tournament","Teen Tournament Summer Games"],"Other":["International Championship","Teachers Tournament"]}}
const roundConversion={"1":"Jeopardy Round","2":"Double Jeopardy Round","3":"Final Jeopardy Round"}
const valueConversion={"0":"Final Jeopardy","-1":"Tiebreaker"}
const defaultSettings={"hintCount":"5","clueSet":"1"}
const defaultRequest=[{"name":"Business","value":"Brands"},{"name":"Business","value":"Companies"},{"name":"Culture","value":"Art"},{"name":"Culture","value":"Awards"},{"name":"Culture","value":"Dance"},{"name":"Culture","value":"Events"},{"name":"Culture","value":"Fashion"},{"name":"Culture","value":"Food & Drink"},{"name":"Culture","value":"Museums"},{"name":"Culture","value":"Theatre"},{"name":"Entertainment","value":"Games"},{"name":"Entertainment","value":"Internet"},{"name":"Entertainment","value":"Magazines & Newspapers"},{"name":"Entertainment","value":"Movies & Film"},{"name":"Entertainment","value":"Television"},{"name":"Entertainment","value":"The Oscars"},{"name":"Geography","value":"Bodies of Water"},{"name":"Geography","value":"Cities"},{"name":"Geography","value":"Countries"},{"name":"Geography","value":"Islands"},{"name":"Geography","value":"Mountains"},{"name":"Geography","value":"States"},{"name":"History","value":"Chronology"},{"name":"History","value":"Famous Women"},{"name":"History","value":"Monarchies"},{"name":"History","value":"Ships & Sailors"},{"name":"History","value":"War"},{"name":"Language","value":"Languages"},{"name":"Language","value":"Letters & Letter Play"},{"name":"Language","value":"Literature"},{"name":"Language","value":"Phrases"},{"name":"Language","value":"Shakespeare"},{"name":"Language","value":"Words & Word Play"},{"name":"Music","value":"Classical Music"},{"name":"Music","value":"Contemporary Music"},{"name":"Nature","value":"Birds"},{"name":"Nature","value":"Parks"},{"name":"Nature","value":"Pets"},{"name":"Nature","value":"Plants"},{"name":"Nature","value":"Trees"},{"name":"Nature","value":"Zoology"},{"name":"Politics","value":"Government"},{"name":"Politics","value":"Law"},{"name":"Politics","value":"Presidents"},{"name":"Politics","value":"World Leaders"},{"name":"Religion","value":"God & Gods"},{"name":"Religion","value":"The Church"},{"name":"Science","value":"Anatomy"},{"name":"Science","value":"Chemistry"},{"name":"Science","value":"Engineering"},{"name":"Science","value":"Health"},{"name":"Science","value":"Measurements"},{"name":"Science","value":"Outer Space"},{"name":"Science","value":"Teeth & Dentistry"},{"name":"Sports","value":"Competition"},{"name":"Sports","value":"Teams"},{"name":"Other","value":"Colleges & Universities"},{"name":"Other","value":"Colors"},{"name":"Other","value":"Flags"},{"name":"Other","value":"Hotels"},{"name":"Other","value":"Money"},{"name":"Other","value":"Numbers & Number Play"},{"name":"Other","value":"Stamps"},{"name":"Jeopardy Round","value":"200"},{"name":"Jeopardy Round","value":"400"},{"name":"Jeopardy Round","value":"600"},{"name":"Jeopardy Round","value":"800"},{"name":"Jeopardy Round","value":"1000"},{"name":"Double Jeopardy Round","value":"400"},{"name":"Double Jeopardy Round","value":"800"},{"name":"Double Jeopardy Round","value":"1200"},{"name":"Double Jeopardy Round","value":"1600"},{"name":"Double Jeopardy Round","value":"2000"},{"name":"Final Jeopardy Round","value":"Final Jeopardy"},{"name":"Final Jeopardy Round","value":"Tiebreaker"},{"name":"Regular","value":"Regular"},{"name":"Celebrity","value":"Celebrity Jeopardy!"},{"name":"Celebrity","value":"Million Dollar Celebrity Invitational"},{"name":"Celebrity","value":"Power Players Week"},{"name":"Champions","value":"All-Star Games"},{"name":"Champions","value":"Battle of the Decades"},{"name":"Champions","value":"Jeopardy! Greatest of All Time"},{"name":"Champions","value":"Million Dollar Masters"},{"name":"Champions","value":"The IBM Challenge"},{"name":"Champions","value":"Tournament of Champions"},{"name":"Champions","value":"Ultimate Tournament of Champions"},{"name":"College","value":"College Championship"},{"name":"College","value":"Kids Week Reunion"},{"name":"Kids","value":"Back to School Week"},{"name":"Kids","value":"Holiday Kids Week"},{"name":"Kids","value":"Kids Week"},{"name":"Teen","value":"Teen Tournament"},{"name":"Teen","value":"Teen Tournament Summer Games"},{"name":"Other","value":"International Championship"},{"name":"Other","value":"Teachers Tournament"},{"name":"hintCount","value":"5"},{"name":"clueSet","value":"1"}]

// Booleans to check whether alerts are visible, initialized as indeterminate
// such that (alert != true) evaluates correctly on first run.
var alertWarning
var alertError

// Initialize everything with default request and settings on page load (function call is at the bottom).
function initApp(){
    // Get temporary credentials to use the API Gateway service.
    var provideCredentials = fromCognitoIdentityPool({
        client: cognitoIdentityClient,
        identityPoolId: identityPoolIdAWS
    })()
    provideCredentials.then(function(creds){
        var apigClient = apigClientFactory.newClient({
            invokeUrl: invokeUrlAWS,
            accessKey: creds.accessKeyId,
            secretKey: creds.secretAccessKey,
            sessionToken: creds.sessionToken,
            region: regionAWS
        })
        generateClue(defaultRequest,apigClient)
        buildCustomization()
        }).catch(function(res){
            console.log(res)
        })     
}

// Randomly generate clue along with corresponding category and metadata.
function generateClue(requestData,apigClient){
    $("#buttonResponse").html("")
    $("#buttons").html("")
    apigClient.invokeApi({},'/ServeClues','POST',{},requestData)
    .then(function(res){
        var result = res['data']
        // No clues to present if the query returns 0 clues,
        // so raise an error and allow users to try again.
        if (result['count'] == 0){
            $("#customizeModalLabel").text(`Customization Settings: 0 clues selected`)
            if (alertError != true){
                $("#customizeModal").find(".modal-body").prepend('<div class="alert alert-danger alert-dismissible">\
                <a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a>\
                <strong>Error:</strong> Filtering returns no clues.\
                </div>')
                $("#buttons").html("Error, please adjust filters")
                alertError = true
                $(".alert-danger").on("close.bs.alert", function(){
                    alertError = false
                }) 
            }
        } else {
            // Close the error alert if the user provides proper filters.
            if (alertError){
                $(".alert-danger").alert("close")
            }
            buildClues(result,requestData,apigClient)
        }        
    }).catch(function(res){
        // Refresh credentials and try again if they have expired (temp credentials expire after an hour).
        if ((res['data']) && (res['data']['message'] == "The security token included in the request is expired")){
            var provideCredentials = fromCognitoIdentityPool({
                client: cognitoIdentityClient,
                identityPoolId: identityPoolIdAWS
            })()
            provideCredentials.then(function(creds){
                var apigClient = apigClientFactory.newClient({
                    invokeUrl: invokeUrlAWS,
                    accessKey: creds.accessKeyId,
                    secretKey: creds.secretAccessKey,
                    sessionToken: creds.sessionToken,
                    region: regionAWS
                })
                generateClue(requestData,apigClient)
                }).catch(function(res){
                    console.log(res)
                })
        // Otherwise, make sure not to call generateClue again to prevent endless loop of API calls.  
        } else {
            console.log(res)
        }
    })
}

// Build the main page with specified clue data set, controlled by filters in the customize page.
function buildClues(result,requestData,apigClient){
    // After randomly generating the clue, find matching category and show data.
    var clue = result['clue']
    var category = result['category']
    var metadata = result['metadata']
    // Extract hint count from request.
    var hintCount = parseInt(requestData.find(row => row["name"]=="hintCount")["value"])
    // Gather and scramble near-miss hints (by default, 4 near misses + correct answer).
    var hints = []
    for (let i = 0; i < hintCount; i++){
        hints.push(clue[`answer${i+1}`])
    }
    for (let i = hints.length - 1; i > 0; i--){
        let j = Math.floor(Math.random()*(i+1));
        [hints[i],hints[j]] = [hints[j],hints[i]]
    }
    $("#assignedCat").text(`${category["categoryassigned"]}: ${category["subcategoryassigned"]}`)
    $("#category").text(`${category["category"]}`)
    $("#clue").text(`${clue["clue"]}`)
    // Remove hints button if hint count setting is set to 1.
    $("#buttons").html('<button type="button" class="btn btn-secondary mx-2 d-none" id="showHints">Show Hints</button>\
    <button type="button" class="btn btn-secondary mx-2" id="showAnswer">Show Answer</button>\
    <button type="button" class="btn btn-secondary mx-2" id="moreInfo">More Info</button>')
    // Otherwise, reveal the "Show Hints" button and give it functionality.
    if (hintCount > 1){
        $("#showHints").removeClass("d-none")
        $("#showHints").on("click",function(){
            $("#buttonResponse").html("The answer is one of the following:<br>")
            hints.forEach(function(hint){
                $("#buttonResponse").append(`${hint}<br>`)
            })
        })
    }
    // Event handlers for answer and metadata buttons.
    $("#showAnswer").on("click",function(){
        $("#buttonResponse").html(`Answer:<br>${clue["answer1"]}<br>\
        <button type="button" class="btn btn-secondary mt-2" id="newClue">New Clue</button>`)
        // Rebuild UI with a different clue if "New Clue" button is clicked.
        $("#newClue").on("click",function(){
            generateClue(requestData,apigClient)
        })
    })
    $("#moreInfo").on("click",function(){
        // Convert numeric codes Final Jeopardy clues, Tiebreakers, and Rounds.
        if (clue["cluevalue"] == "0" || clue["cluevalue"] == "-1"){
            $("#buttonResponse").html(`Value: ${valueConversion[clue["cluevalue"]]}<br>\
            Round: ${roundConversion[category["round"]]}<br>\
            Airdate: ${metadata["airdate"]}<br>
            Show Type: ${metadata["showsubtype"]}`)
        } else {
            $("#buttonResponse").html(`Value: ${clue["cluevalue"]}<br>\
            Round: ${roundConversion[category["round"]]}<br>\
            Airdate: ${metadata["airdate"]}<br>
            Show Type: ${metadata["showsubtype"]}`)
        }
        if (category["categorycomment"]){
            $("#buttonResponse").prepend(`Category Comment: ${category["categorycomment"]}<br>`)
        }
    })
    // Update clue count on customization modal with new filtered data.
    if (result['count']==1){
        $("#customizeModalLabel").text(`Customization Settings: 1 clue selected`)
    } else {
        $("#customizeModalLabel").text(`Customization Settings: ${result['count']} clues selected`)
    }
    // Event handler for the 'Save Changes' button is not in buildCustomization() as it needs 
    // the previous request (requestData) to determine whether or not to generate a new clue.
    $("#customizeSave").off("click").on("click",function(){
        // If the form is idential to the previous request, do nothing.
        if ($("form").serialize() == $.param(requestData)) {
        // If the only change in the form is in the hint count, do not generate a new clue, just update hints.
        } else if ($("form").serialize().replace(/hintCount=\d+/,'') == $.param(requestData).replace(/hintCount=\d+/,'')){
            // Extract hint count from the form this time.
            var hintCount = parseInt($("form").serializeArray().find(row => row["name"]=="hintCount")["value"])
            var hints = []
            for (let i = 0; i < hintCount; i++){
                hints.push(result['clue'][`answer${i+1}`])
            }
            for (let i = hints.length - 1; i > 0; i--){
                let j = Math.floor(Math.random()*(i+1));
                [hints[i],hints[j]] = [hints[j],hints[i]]
            }
            // If the "Show Hints" button is currently selected, update the text that it shows.
            if ($("#buttonResponse:contains('The answer is one of the following:')").length>0){
                if (hintCount == 1){
                    $("#buttonResponse").html("")
                } else {
                    $("#buttonResponse").html("The answer is one of the following:<br>")
                    hints.forEach(function(hint){
                        $("#buttonResponse").append(`${hint}<br>`)
                    })
                }
            }
            // If the new hint count is greater than 1, update the "Show Hints" event handler.
            if (hintCount > 1){
                $("#showHints").removeClass("d-none")
                $("#showHints").off("click").on("click",function(){
                    $("#buttonResponse").html("The answer is one of the following:<br>")
                    hints.forEach(function(hint){
                        $("#buttonResponse").append(`${hint}<br>`)
                    })
                })
            // Otherwise just remove the button.
            } else if (hintCount == 1){
                $("#showHints").addClass("d-none")
            }
            // Update the requestData variable we are comparing to with the form data.
            requestData = $("form").serializeArray()
        } else {
            // Ensure the requestData variable is updated, as buildClues() is not called if generateClue() returns 0 clues.
            requestData = $("form").serializeArray()
            generateClue(requestData,apigClient)
        }
    })
    // Removing focus state from buttons, but only for mouse users.
    $(".btn").off("mouseout").on("mouseout",function(){
        $(this).trigger("blur")
    })
}

// Build the customization modal with all possible filters, dictated by the supplementary objects at the top.
function buildCustomization(){
    // Populate category/subcategory filters.
    $("#collapseOne").find(".card-body").html("")
    for (let [key,values] of Object.entries(labels["category"])){
        $("#collapseOne").find(".card-body").append(`<div class="btn-group-toggle text-left h5 my-2" id="${key}" data-toggle="buttons">\
        <label class="mb-0 align-top filterLabel">${key}</label>\
        <label class="btn btn-secondary active"><input type="radio" class="all" checked><h5 class=mb-0>All</h5></label>\
        <label class="btn btn-secondary"><input type="radio" class="none"><h5 class=mb-0>None</h5></label>\
        <label class="btn btn-secondary dropdown-toggle"><input type="checkbox" class="choose"></label>\
        </div>`)
        values.forEach(function(value){
            $("#collapseOne").find(".card-body").append(`<div class="custom-control custom-checkbox text-left d-none">\
            <input type="checkbox" class="custom-control-input" name="${key}" value="${value}" id="${key}${value}" checked="">\
            <label class="custom-control-label" for="${key}${value}">${value}</label></div>`)
        })
    }
    // Populate round/value filters.
    $("#collapseTwo").find(".card-body").html("")
    for (let [key,values] of Object.entries(labels["round"])){
        $("#collapseTwo").find(".card-body").append(`<div class="btn-group-toggle text-left h5 my-2" id="${key}" data-toggle="buttons">\
        <label class="mb-0 align-top filterLabel">${key}</label>\
        <label class="btn btn-secondary active"><input type="radio" class="all" checked><h5 class=mb-0>All</h5></label>\
        <label class="btn btn-secondary"><input type="radio" class="none"><h5 class=mb-0>None</h5></label>\
        <label class="btn btn-secondary dropdown-toggle"><input type="checkbox" class="choose"></label>\
        </div>`)
        values.forEach(function(value){
            $("#collapseTwo").find(".card-body").append(`<div class="custom-control custom-checkbox text-left d-none">\
            <input type="checkbox" class="custom-control-input" name="${key}" value="${value}" id="${key}${value}" checked="">\
            <label class="custom-control-label" for="${key}${value}">${value}</label></div>`)
        })
    }
    // Populate show type filters.
    $("#collapseThree").find(".card-body").html("")
    for (let [key,values] of Object.entries(labels["showType"])){
        $("#collapseThree").find(".card-body").append(`<div class="btn-group-toggle text-left h5 my-2" id="${key}" data-toggle="buttons">\
        <label class="mb-0 align-top filterLabel">${key}</label>\
        <label class="btn btn-secondary active"><input type="radio" class="all" checked><h5 class=mb-0>All</h5></label>\
        <label class="btn btn-secondary"><input type="radio" class="none"><h5 class=mb-0>None</h5></label>\
        <label class="btn btn-secondary dropdown-toggle"><input type="checkbox" class="choose"></label>\
        </div>`)
        values.forEach(function(value){
            $("#collapseThree").find(".card-body").append(`<div class="custom-control custom-checkbox text-left d-none">\
            <input type="checkbox" class="custom-control-input" name="${key}" value="${value}" id="${key}${value}" checked="">\
            <label class="custom-control-label" for="${key}${value}">${value}</label></div>`)
        })
    }
    // Populate advanced settings.
    $("#collapseFour").find(".card-body").html("")
    $("#collapseFour").find(".card-body").append(`<div class="row">\
        <div class="col-md-2 col-xs-3"><label for="hintCount"><h5 class=mb-0>Hints</h5></label></div>\
        <div class="col-md-9 col-xs-8"><input type="range" class="custom-range" name="hintCount" min="1" max="11" id="hintCount" value="${defaultSettings["hintCount"]}" oninput="hints.value=hintCount.value"></div>\
        <div class="col-md-1 col-xs-1"><h5 class=mb-0><output id="hints" name="hints" for="hintCount">${defaultSettings["hintCount"]}</output></h5></div></div>\
        <div class="btn-group-toggle text-left h5 my-2" id="clueSet" data-toggle="buttons">\
        <label class="mb-0 align-top filterLabel">Clue Set</label>\
        <label class="btn btn-secondary"><input type="radio" name="clueSet" value="1"><h5 class=mb-0>1</h5></label>\
        <label class="btn btn-secondary"><input type="radio" name="clueSet" value="2"><h5 class=mb-0>2</h5></label>\
        <label class="btn btn-secondary"><input type="radio" name="clueSet" value="3"><h5 class=mb-0>3</h5></label></div>`)
    // Converting the enter key on label tags acting as buttons and checkboxes to clicks to allow keyboard usage.
    $(".btn").off("keypress").on("keypress",function(e){
        if (e.key === "Enter"){
            $(this)[0].click()
        }
    })
    $(".custom-control-input").on("keypress",function(e){
        if (e.key === "Enter"){
            $(this)[0].click()
        }
    })
    // There are no sub-filters for Regular show type, so remove the option.
    $("#Regular").find(".dropdown-toggle").addClass("d-none")
    // Show sub-filters on clicking dropdown button.
    $(".choose").on("click",function(){
        var id = $(this).parent().parent().attr("id")
        $(`input[name="${id}"]`).each(function(){
            $(this).parent().toggleClass("d-none")
        })
    })
    // Check all sub-filter checkboxes on clicking "All" button (the reverse is also handled down below).
    $(".all").on("click",function(){
        var id = $(this).parent().parent().attr("id")
        $(`input[name="${id}"]`).each(function(){
            $(this).prop("checked",true)
        })
    })
    // Uncheck all sub-filter checkboxes on clicking "None" button.
    $(".none").on("click",function(){
        var id = $(this).parent().parent().attr("id")
        $(`input[name="${id}"]`).each(function(){
            $(this).prop("checked",false)
        })
    })
    // Activate "All", "None", or neither filter button depending on whether all, none, or some sub-filter checkboxes are checked.
    $(".custom-control-input").on("change",function(){
        var id = $(this).attr("name")
        if ($(`input[name="${id}"]:checked`).length == $(`input[name="${id}"]`).length){
            $(`div[id="${id}"]`).find(".all").parent().addClass("active")
            $(`div[id="${id}"]`).find(".none").parent().removeClass("active")
        } else if ($(`input[name="${id}"]:checked`).length == 0){
            $(`div[id="${id}"]`).find(".all").parent().removeClass("active")
            $(`div[id="${id}"]`).find(".none").parent().addClass("active")            
        } else {
            $(`div[id="${id}"]`).find(".all").parent().removeClass("active")
            $(`div[id="${id}"]`).find(".none").parent().removeClass("active")
        }
    })
    // Clean up the customization modal on smaller screens.
    if ($(window).width() <= 500){
        $(".filterLabel").each(function(){
            $(this).after("<br>")
        })
    }
    // Activate clue set button manually, as there is a handler below to display a warning on change.
    $("#clueSet").find(`input[value="1"]`)[0].click()
    $("#clueSet").find(`input[value="1"]`).trigger("blur")
    $("input[type=radio][name=clueSet]").on("change",function(){
        // No need to display the warning if the clue set is changed to 1.
        if (this.value != "1"){
            if (alertWarning != true){
                $("#customizeModal").find(".modal-body").prepend('<div class="alert alert-warning alert-dismissible">\
                <a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a>\
                <strong>Warning:</strong> Clue sets 2 and 3 have less reliable categorization and will take longer to load.\
                </div>')
                alertWarning = true
                $(".alert-warning").on("close.bs.alert", function(){
                    alertWarning = false
                })
            }
        }
    })
    // Rebuild customization modal with default settings.
    $("#customizeReset").off("click").on("click",function(){
        // Close the warning alert if the user resets filters (thus changing clue set to 1).
        if (alertWarning){
            $(".alert-warning").alert("close")
        }
        buildCustomization()
    })
    // Removing focus state from buttons, but only for mouse users.
    $(".btn").off("mouseout").on("mouseout",function(){
        $(this).trigger("blur")
    })
}

// No need to pass anything into initApp since we have global variables for default request and settings.
initApp();