// AWS dependencies and config.
import {CognitoIdentityClient} from "@aws-sdk/client-cognito-identity";
import {fromCognitoIdentityPool} from "@aws-sdk/credential-provider-cognito-identity";
import {default as apigClientFactory} from "aws-api-gateway-client";
const regionAWS = "us-east-2";
const identityPoolIdAWS = "us-east-2:5f1995a6-d8c2-40aa-b0cd-d993cf08f7b0";
const invokeUrlAWS = "https://ys7dxtnbo9.execute-api.us-east-2.amazonaws.com/default";
const cognitoIdentityClient = new CognitoIdentityClient({region: regionAWS});

// Some supplementary data to populate customization fields and handle differences
// between screen names (ex: Jeopardy Round) and underlying data (ex: category[round] of 1).
const labels={"category":{"Business":["Brands","Companies"],"Culture":["Art","Awards","Dance","Events","Fashion","Food & Drink","Museums","Theatre"],"Entertainment":["Games","Internet","Magazines & Newspapers","Movies & Film","Television","The Oscars"],"Geography":["Bodies of Water","Cities","Countries","Islands","Mountains","States"],"History":["Chronology","Famous Women","Monarchies","Ships & Sailors","War"],"Language":["Languages","Letters & Letter Play","Literature","Phrases","Shakespeare","Words & Word Play"],"Music":["Classical Music","Contemporary Music"],"Nature":["Birds","Parks","Pets","Plants","Trees","Zoology"],"Politics":["Government","Law","Presidents","World Leaders"],"Religion":["God & Gods","The Church"],"Science":["Anatomy","Chemistry","Engineering","Health","Measurements","Outer Space","Teeth & Dentistry"],"Sports":["Competition","Teams"],"Other":["Colleges & Universities","Colors","Flags","Hotels","Money","Numbers & Number Play","Stamps"]},"round":{"Jeopardy Round":["200","400","600","800","1000"],"Double Jeopardy Round":["400","800","1200","1600","2000"],"Final Jeopardy Round":["Final Jeopardy","Tiebreaker"]},"showType":{"Regular":["Regular"],"Celebrity":["Celebrity Jeopardy!","Million Dollar Celebrity Invitational","Power Players Week"],"Champions":["All-Star Games","Battle of the Decades","Jeopardy! Greatest of All Time","Million Dollar Masters","The IBM Challenge","Tournament of Champions","Ultimate Tournament of Champions"],"College":["College Championship","Kids Week Reunion"],"Kids":["Back to School Week","Holiday Kids Week","Kids Week"],"Teen":["Teen Tournament","Teen Tournament Summer Games"],"Other":["International Championship","Teachers Tournament"]}};
const roundConversion={"1":"Jeopardy Round","2":"Double Jeopardy Round","3":"Final Jeopardy Round"};
const valueConversion={"0":"Final Jeopardy","-1":"Tiebreaker"};
const defaultSettings={"hintCount":"5","backtrack":"off"};
const defaultRequest=[{"name":"Business","value":"Brands"},{"name":"Business","value":"Companies"},{"name":"Culture","value":"Art"},{"name":"Culture","value":"Awards"},{"name":"Culture","value":"Dance"},{"name":"Culture","value":"Events"},{"name":"Culture","value":"Fashion"},{"name":"Culture","value":"Food & Drink"},{"name":"Culture","value":"Museums"},{"name":"Culture","value":"Theatre"},{"name":"Entertainment","value":"Games"},{"name":"Entertainment","value":"Internet"},{"name":"Entertainment","value":"Magazines & Newspapers"},{"name":"Entertainment","value":"Movies & Film"},{"name":"Entertainment","value":"Television"},{"name":"Entertainment","value":"The Oscars"},{"name":"Geography","value":"Bodies of Water"},{"name":"Geography","value":"Cities"},{"name":"Geography","value":"Countries"},{"name":"Geography","value":"Islands"},{"name":"Geography","value":"Mountains"},{"name":"Geography","value":"States"},{"name":"History","value":"Chronology"},{"name":"History","value":"Famous Women"},{"name":"History","value":"Monarchies"},{"name":"History","value":"Ships & Sailors"},{"name":"History","value":"War"},{"name":"Language","value":"Languages"},{"name":"Language","value":"Letters & Letter Play"},{"name":"Language","value":"Literature"},{"name":"Language","value":"Phrases"},{"name":"Language","value":"Shakespeare"},{"name":"Language","value":"Words & Word Play"},{"name":"Music","value":"Classical Music"},{"name":"Music","value":"Contemporary Music"},{"name":"Nature","value":"Birds"},{"name":"Nature","value":"Parks"},{"name":"Nature","value":"Pets"},{"name":"Nature","value":"Plants"},{"name":"Nature","value":"Trees"},{"name":"Nature","value":"Zoology"},{"name":"Politics","value":"Government"},{"name":"Politics","value":"Law"},{"name":"Politics","value":"Presidents"},{"name":"Politics","value":"World Leaders"},{"name":"Religion","value":"God & Gods"},{"name":"Religion","value":"The Church"},{"name":"Science","value":"Anatomy"},{"name":"Science","value":"Chemistry"},{"name":"Science","value":"Engineering"},{"name":"Science","value":"Health"},{"name":"Science","value":"Measurements"},{"name":"Science","value":"Outer Space"},{"name":"Science","value":"Teeth & Dentistry"},{"name":"Sports","value":"Competition"},{"name":"Sports","value":"Teams"},{"name":"Other","value":"Colleges & Universities"},{"name":"Other","value":"Colors"},{"name":"Other","value":"Flags"},{"name":"Other","value":"Hotels"},{"name":"Other","value":"Money"},{"name":"Other","value":"Numbers & Number Play"},{"name":"Other","value":"Stamps"},{"name":"Jeopardy Round","value":"200"},{"name":"Jeopardy Round","value":"400"},{"name":"Jeopardy Round","value":"600"},{"name":"Jeopardy Round","value":"800"},{"name":"Jeopardy Round","value":"1000"},{"name":"Double Jeopardy Round","value":"400"},{"name":"Double Jeopardy Round","value":"800"},{"name":"Double Jeopardy Round","value":"1200"},{"name":"Double Jeopardy Round","value":"1600"},{"name":"Double Jeopardy Round","value":"2000"},{"name":"Final Jeopardy Round","value":"Final Jeopardy"},{"name":"Final Jeopardy Round","value":"Tiebreaker"},{"name":"Regular","value":"Regular"},{"name":"Celebrity","value":"Celebrity Jeopardy!"},{"name":"Celebrity","value":"Million Dollar Celebrity Invitational"},{"name":"Celebrity","value":"Power Players Week"},{"name":"Champions","value":"All-Star Games"},{"name":"Champions","value":"Battle of the Decades"},{"name":"Champions","value":"Jeopardy! Greatest of All Time"},{"name":"Champions","value":"Million Dollar Masters"},{"name":"Champions","value":"The IBM Challenge"},{"name":"Champions","value":"Tournament of Champions"},{"name":"Champions","value":"Ultimate Tournament of Champions"},{"name":"College","value":"College Championship"},{"name":"College","value":"Kids Week Reunion"},{"name":"Kids","value":"Back to School Week"},{"name":"Kids","value":"Holiday Kids Week"},{"name":"Kids","value":"Kids Week"},{"name":"Teen","value":"Teen Tournament"},{"name":"Teen","value":"Teen Tournament Summer Games"},{"name":"Other","value":"International Championship"},{"name":"Other","value":"Teachers Tournament"},{"name":"clueSet","value":"1"}];

// Boolean to check whether the alert is visible, initialized as indeterminate
// such that (alert != true) evaluates correctly on first run.
var alertError;

// Clue queue's index is set to clueQueue.length - 1 whenever clues are added.
var clueQueue = [];
var clueIndex = -1;

// Initialize everything with default request and settings on page load.
function initApp() {

    // Promise to get temporary credentials to use the API Gateway service.
    fromCognitoIdentityPool({
        client: cognitoIdentityClient,
        identityPoolId: identityPoolIdAWS
    })()

    // On success, build the client to call the clue API and build filters.
    .then(function(creds) {
        var apigClient = apigClientFactory.newClient({
            invokeUrl: invokeUrlAWS,
            accessKey: creds.accessKeyId,
            secretKey: creds.secretAccessKey,
            sessionToken: creds.sessionToken,
            region: regionAWS
        });
        generateClue(defaultRequest,defaultSettings,apigClient);
        buildCustomization();
    })

    // On fail, the app will break as it can't call the API. Log for debugging.
    .catch(function(res) {
        console.log(res);
    });
}

// Randomly generate clue along with corresponding category and metadata.
function generateClue(requestData,settings,apigClient) {

    // Clear buttons to prevent overlapping API calls.
    $("#buttonResponse").html("");
    $("#buttons").html("");

    // Make the call to AWS API Gateway. Settings are not needed server-side.
    apigClient.invokeApi({},"/ServeClues","POST",{},requestData)

    // On success, check that response is valid. If so, build UI with clue data.
    .then(function(res) {
        var result = res.data;

        // If no clues are returned, raise an error and allow users to try again.
        if (result.count == 0) {
            $("#customizeModalLabel").text(`Customization Settings: 0 clues selected`);
            if (alertError != true) {
                $("#customizeModal").find(".modal-body").prepend(`<div class="alert alert-danger alert-dismissible">
                <a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a>
                <strong>Error:</strong> Filtering returns no clues.
                </div>`);
                $("#buttons").html("Error, please adjust filters");
                alertError = true;
                $(".alert-danger").on("close.bs.alert", function() {
                    alertError = false;
                });
            }

        // Otherwise, we have a valid response and can proceed.
        } else {

            // Close the alert as the user has fixed the error.
            if (alertError) {
                $(".alert-danger").alert("close");
            }

            // Save the result into the clue queue and adjust the index accordingly.
            clueQueue.push(result);
            clueIndex = clueQueue.length - 1;

            // Build the main clue UI.
            buildClues(result,requestData,settings,apigClient);
        }
    })

    // On failure, check if it was due to expired credentials (temp credentials expire after an hour).
    .catch(function(res) {

        // Expired credentials return this exact message.
        if (res.message == "Request failed with status code 499") {

            // Generate new promise for credentials, still looking into how to refresh.
            fromCognitoIdentityPool({
                client: cognitoIdentityClient,
                identityPoolId: identityPoolIdAWS
            })()

            // On success, only build clue UI as filters are already populated.
            .then(function(creds) {
                apigClient = apigClientFactory.newClient({
                    invokeUrl: invokeUrlAWS,
                    accessKey: creds.accessKeyId,
                    secretKey: creds.secretAccessKey,
                    sessionToken: creds.sessionToken,
                    region: regionAWS
                });
            generateClue(requestData,settings,apigClient);
            })

            // On fail, break and log for debugging.
            .catch(function(res) {
                console.log(res);
            });

        // Other API call failures are likely due to invalid input/output. Log for debugging.
        } else {
            console.log(res);
        }
    });
}

// Build the main page with specified clue data.
function buildClues(result,requestData,settings,apigClient) {

    // Clear UI of existing buttons as they may contain previous clue data.
    $("#buttonResponse").html("");
    $("#buttons").html("");

    // Separate clue, category, and metadata for convenience.
    var clue = result.clue;
    var category = result.category;
    var metadata = result.metadata;

    // Gather and scramble near-miss hints (by default, 4 near misses + correct answer).
    var hintCount = parseInt(settings.hintCount);
    var hints = [];
    for (let i = 0; i < hintCount; i++) {
        hints.push(clue[`answer${i+1}`]);
    }
    for (let i = hints.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random()*(i+1));
        [hints[i],hints[j]] = [hints[j],hints[i]];
    }

    // Populate headers with basic data.
    $("#assignedCat").text(`${category.categoryassigned}: ${category.subcategoryassigned}`);
    $("#category").text(`${category.category}`);
    $("#clue").text(`${clue.clue}`);

    // Add buttons, "Show Hints" being hidden by default as it may not need functionality.
    $("#buttons").html(`<button type="button" class="btn btn-secondary mx-2 d-none" id="showHints">Show Hints</button>
    <button type="button" class="btn btn-secondary mx-2" id="showAnswer">Show Answer</button>
    <button type="button" class="btn btn-secondary mx-2" id="moreInfo">More Info</button>`);

    // Give "Show Hints" button functionality only if hints are enabled.
    if (hintCount > 1) {
        $("#showHints").removeClass("d-none");
        $("#showHints").on("click",function() {
            $("#buttonResponse").html("The answer is one of the following:<br>");
            hints.forEach(function(hint) {
                $("#buttonResponse").append(`${hint}<br>`);
            });
        });
    }

    // Give "Show Answer" button functionality to show the answer and give the option to generate a new clue.
    $("#showAnswer").on("click",function() {
        $("#buttonResponse").html(`Answer:<br>${clue.answer1}<br>
        <button type="button" class="btn btn-secondary mt-2" id="newClue">New Clue</button>`);
        $("#newClue").on("click",function() {
            generateClue(requestData,settings,apigClient);
        });
    });

    // Give "More info" button functionality to display metadata items.
    $("#moreInfo").on("click",function() {

        // Convert numeric codes in the database to text for Final Jeopardy clues, Tiebreakers, and Rounds.
        if (clue.cluevalue == "0" || clue.cluevalue == "-1") {
            $("#buttonResponse").html(`Value: ${valueConversion[clue.cluevalue]}<br>
            Round: ${roundConversion[category.round]}<br>
            Airdate: ${metadata.airdate}<br>
            Show Type: ${metadata.showsubtype}`);
        } else {
            $("#buttonResponse").html(`Value: ${clue.cluevalue}<br>
            Round: ${roundConversion[category.round]}<br>
            Airdate: ${metadata.airdate}<br>
            Show Type: ${metadata.showsubtype}`);
        }
        if (category.categorycomment) {
            $("#buttonResponse").prepend(`Category Comment: ${category.categorycomment}<br>`);
        }
    });

    // Update clue count on customization modal with new filtered data.
    if (result.count == 1) {
        $("#customizeModalLabel").text(`Customization Settings: 1 clue selected`);
    } else {
        $("#customizeModalLabel").text(`Customization Settings: ${result.count} clues selected`);
    }

    // Function to enable backtrack buttons and give them functionality.
    function buildBacktrack() {

        // Disable right button if we are at the front of the queue.
        if (clueIndex == clueQueue.length - 1) {
            $(".backtrack-right").prop("disabled",true);
        } else {
            $(".backtrack-right").prop("disabled",false);
        }

        // Disable left button if we are at the back of the queue.
        if (clueIndex == 0) {
            $(".backtrack-left").prop("disabled",true);
        } else {
            $(".backtrack-left").prop("disabled",false);
        }

        // Give backtrack buttons functionality the first time this function is called.
        if (!($._data($(".backtrack-left")[0],"events").click)) {
            $(".backtrack-left").on("click",function() {
                clueIndex -= 1;
                buildClues(clueQueue[clueIndex],requestData,settings,apigClient);
            });
            $(".backtrack-right").on("click",function() {
                clueIndex += 1;
                buildClues(clueQueue[clueIndex],requestData,settings,apigClient);
            });
        }
    }

    // Control visibility/functionality of backtrack buttons.
    if (settings.backtrack == "on") {
        $(".backtrack-btn").css("visibility","");
        buildBacktrack();
    } else {
        $(".backtrack-btn").css("visibility","hidden");
    }

    // Give "Save Changes" button in the modal functionality to change the request sent to server.
    $("#customizeSave").off("click").on("click",function() {

        // If the form is idential to the previous request, check if the settings have changed.
        if ($("form").serialize() == $.param(requestData)) {

            // If the hint count has changed, update the clue UI to reflect changes.
            if (settings.hintCount != $("#hintCount")[0].value) {

                // Extract hint count from the modal this time.
                hintCount = parseInt($("#hintCount")[0].value);
                hints = [];
                for (let i = 0; i < hintCount; i++) {
                    hints.push(clue[`answer${i+1}`]);
                }
                for (let i = hints.length - 1; i > 0; i--) {
                    let j = Math.floor(Math.random()*(i+1));
                    [hints[i],hints[j]] = [hints[j],hints[i]];
                }

                // If the "Show Hints" button is currently selected, update the displayed text.
                if ($("#buttonResponse:contains('The answer is one of the following:')").length>0) {
                    if (hintCount == 1) {
                        $("#buttonResponse").html("");
                    } else {
                        $("#buttonResponse").html("The answer is one of the following:<br>");
                        hints.forEach(function(hint) {
                            $("#buttonResponse").append(`${hint}<br>`);
                        });
                    }
                }

                // If the new hint count is greater than 1, update the "Show Hints" event handler.
                if (hintCount > 1) {
                    $("#showHints").removeClass("d-none");
                    $("#showHints").off("click").on("click",function() {
                        $("#buttonResponse").html("The answer is one of the following:<br>");
                        hints.forEach(function(hint) {
                            $("#buttonResponse").append(`${hint}<br>`);
                        });
                    });

                // Otherwise just remove the button.
                } else if (hintCount == 1) {
                    $("#showHints").addClass("d-none");
                }
            }

            // If the backtrack setting has changed, update the clue UI to reflect changes.
            if (settings.backtrack != $("#backtrack label.active input").attr("class")) {

                // Extract backtrack setting from the form.
                if ($("#backtrack label.active input").attr("class") == "on") {
                    $(".backtrack-btn").css("visibility","");
                    buildBacktrack();
                } else {
                    $(".backtrack-btn").css("visibility","hidden");
                }
            }

            // Update the stored settings object to reflect saved changes.
            settings = {"hintCount":$("#hintCount")[0].value,
                        "backtrack":$("#backtrack label.active input").attr("class")};

        // If the form has changed, update the stored request + settings and generate a new clue.
        } else {
            settings = {"hintCount":$("#hintCount")[0].value,
                        "backtrack":$("#backtrack label.active input").attr("class")};
            requestData = $("form").serializeArray();
            generateClue(requestData,settings,apigClient);
        }
    });

    // Removing focus state from buttons, but only for mouse users.
    $(".btn").off("mouseout").on("mouseout",function() {
        $(this).trigger("blur");
    });
}

// Build the customization modal with all possible filters, dictated by the supplementary objects at the top.
function buildCustomization() {

    // Function to populate a card using filter buttons and checkboxes.
    function populateFilters(id,subLabels) {

        // Store jQuery result as we will be appending many elements.
        var cardBody = $(`#${id}`).find(".card-body");

        // Clear the existing card, this resets existing filters.
        cardBody.html("");

        // For each key in labels we want an "Include", "Exclude", and "Specify" button.
        for (let [key,values] of Object.entries(subLabels)) {

            // Append button group to the card, font awesome icons are used.
            cardBody.append(`<div class="btn-group-toggle h5 my-2 d-flex" id="${key}" data-toggle="buttons">
            <label class="mb-0 filterLabel mr-auto">${key}</label>
            <label class="btn btn-secondary active"><input type="radio" class="all"><i class="fas fa-check fa-fw"></i></label>
            <label class="btn btn-secondary mx-1"><input type="radio" class="none"><i class="fas fa-times fa-fw"></i></label>
            <label class="btn btn-secondary"><input type="checkbox" class="choose"><i class="fas fa-caret-down fa-fw"></i></label>
            </div>`);

            // Build checkboxes after the button group so the "Specify" dropdown flows well.
            for (let value of values.values()) {
                cardBody.append(`<div class="custom-control custom-checkbox d-none">\
                <input type="checkbox" class="custom-control-input" name="${key}" value="${value}" id="${key}${value}" checked>\
                <label class="custom-control-label" for="${key}${value}">${value}</label></div>`);
            }
        }
    }

    // Populate category/subcategory, round/value, and show type/event filters.
    populateFilters("collapseOne",labels.category);
    populateFilters("collapseTwo",labels.round);
    populateFilters("collapseThree",labels.showType);

    // Set hint count and text to default values.
    $("#hintCount").prop("value",defaultSettings.hintCount);
    $("#hints").text(defaultSettings.hintCount);

    // Activate clue set button manually.
    $("#clueSet").find(`input[value="${defaultRequest.find(element => element.name == "clueSet").value}"]`)[0].click();
    $("#clueSet").find(`input[value="${defaultRequest.find(element => element.name == "clueSet").value}"]`).trigger("blur");

    // Activate backtrack button manually.
    // JS is used instead of HTML in case I plan to change the default settings/clue set.
    $("#backtrack").find(`input.${defaultSettings.backtrack}`)[0].click();
    $("#backtrack").find(`input.${defaultSettings.backtrack}`).trigger("blur");

    // There are no sub-filters for Regular show type, so remove the option but keep alignment.
    $("#Regular").find(".choose").parent().css("visibility","hidden");

    // Clean up the customization modal on smaller screens.
    if ($(window).width() <= 500) {
        $(".filterLabel").each(function() {
            $(this).parent().removeClass("d-flex");
            $(this).after("<br>");
        });
    }

    // Converting the enter key on label tags acting as buttons and checkboxes to clicks to allow keyboard usage.
    $(".btn").off("keypress").on("keypress",function(e) {
        if (e.key === "Enter") {
            $(this)[0].click();
        }
    });
    $(".custom-control-input").on("keypress",function(e) {
        if (e.key === "Enter") {
            $(this)[0].click();
        }
    });

    // Show sub-filters on clicking dropdown button.
    $(".choose").on("click",function() {
        var id = $(this).parent().parent().attr("id");
        $(`input[name="${id}"]`).each(function() {
            $(this).parent().toggleClass("d-none");
        });
    });

    // Check all sub-filter checkboxes on clicking "All" button.
    $(".all").on("click",function() {
        var id = $(this).parent().parent().attr("id");
        $(`input[name="${id}"]`).each(function() {
            $(this).prop("checked",true);
        });
    });

    // Uncheck all sub-filter checkboxes on clicking "None" button.
    $(".none").on("click",function() {
        var id = $(this).parent().parent().attr("id");
        $(`input[name="${id}"]`).each(function() {
            $(this).prop("checked",false);
        });
    });

    // Activate "All", "None", or neither filter button depending on whether all, none, or some sub-filter checkboxes are checked.
    $(".custom-control-input").on("change",function() {
        var id = $(this).attr("name");
        if ($(`input[name="${id}"]:checked`).length == $(`input[name="${id}"]`).length) {
            $(`div[id="${id}"]`).find(".all").parent().addClass("active");
            $(`div[id="${id}"]`).find(".none").parent().removeClass("active");
        } else if ($(`input[name="${id}"]:checked`).length == 0) {
            $(`div[id="${id}"]`).find(".all").parent().removeClass("active");
            $(`div[id="${id}"]`).find(".none").parent().addClass("active");
        } else {
            $(`div[id="${id}"]`).find(".all").parent().removeClass("active");
            $(`div[id="${id}"]`).find(".none").parent().removeClass("active");
        }
    });

    // Rebuild customization modal with default settings.
    $("#customizeReset").off("click").on("click",function() {
        buildCustomization();
    });

    // Removing focus state from buttons, but only for mouse users.
    // Repeated because buildClues and buildCustomzation each create buttons and can be called at any time.
    $(".btn").off("mouseout").on("mouseout",function() {
        $(this).trigger("blur");
    });

    // Enable tooltips.
    $(function () {
        $('[data-toggle="tooltip"]').tooltip();
    });
}

initApp();