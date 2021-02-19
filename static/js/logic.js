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

// Randomly generate clue along with corresponding category and metadata.
function generateClue(requestData, settings){
    $("#buttonResponse").html("")
    $.ajax({
        type:"POST",
        url:"https://ys7dxtnbo9.execute-api.us-east-2.amazonaws.com/default/ServeClues",
        data: JSON.stringify(requestData),
        crossDomain: true,
        dataType: 'json',
        success: function(result){
            if (result['count'] == 0){
                $("#customizeModalLabel").text(`Customization Settings: 0 clues selected`)
                if (alertError != true){
                    $("#customizeModal").find(".modal-body").prepend('<div class="alert alert-danger alert-dismissible">\
                    <a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a>\
                    <strong>Error:</strong> Filtering returns no clues.\
                    </div>')
                    alertError = true
                    $(".alert-danger").on("close.bs.alert", function(){
                        alertError = false
                    }) 
                }                
            } else {
                buildClues(result,settings)
            }
        },
        error: function(xhr,ajaxOptions,thrownError){
            console.log(xhr)
            console.log(ajaxOptions)
            console.log(thrownError)
        }
    })
}

function initApp(){
    generateClue(defaultRequest,defaultSettings)
    buildCustomization(defaultSettings)
}

// Build the main page with specified clue data set, controlled by filters in the customize page.
function buildClues(result, settings){
    // After randomly generating the clue, find matching category and show data.
    var clue = result['clue']
    var category = result['category']
    var metadata = result['metadata']
    // Gather and scramble near-miss hints (by default, 4 near misses + correct answer).
    var hints = []
    for (let i = 0; i < parseInt(settings["hintCount"]); i++){
        hints.push(`${clue[`answer${i+1}`]}`)
    }
    for (let i = hints.length - 1; i > 0; i--){
        let j = Math.floor(Math.random()*(i+1));
        [hints[i],hints[j]] = [hints[j],hints[i]]
    }
    $("#assignedCat").text(`${category["categoryassigned"]}: ${category["subcategoryassigned"]}`)
    $("#category").text(`${category["category"]}`)
    $("#clue").text(`${clue["clue"]}`)
    // Remove hints button if hint setting is set to 1.
    if (hints.length === 1){
        $("#buttons").html('<button type="button" class="btn btn-secondary mx-2 d-none" id="showHints">Show Hints</button>\
        <button type="button" class="btn btn-secondary mx-2" id="showAnswer">Show Answer</button>\
        <button type="button" class="btn btn-secondary mx-2" id="moreInfo">More Info</button>')
    } else {
        $("#buttons").html('<button type="button" class="btn btn-secondary mx-2" id="showHints">Show Hints</button>\
        <button type="button" class="btn btn-secondary mx-2" id="showAnswer">Show Answer</button>\
        <button type="button" class="btn btn-secondary mx-2" id="moreInfo">More Info</button>')
    }
    // Event handlers for hint, answer, and metadata buttons.
    // Rebuild UI with a different clue if "New Clue" button is clicked.
    $("#showAnswer").click(function(){
        $("#buttonResponse").html(`Answer:<br>${clue["answer1"]}<br>\
        <button type="button" class="btn btn-secondary mt-2" id="newClue">New Clue</button>`)
        $("#newClue").click(function(){
            generateClue($("form").serializeArray(),settings)
        })
    })
    $("#showHints").click(function(){
        $("#buttonResponse").html("The answer is one of the following:<br>")
        hints.forEach(function(hint){
            $("#buttonResponse").append(`${hint}<br>`)
        })
    })
    $("#moreInfo").click(function(){
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
}

// Build the customization modal with all possible filters, dictated by the supplementary objects at the top.
function buildCustomization(settings){
    // Populate category/subcategory filters.
    $("#collapseOne").find(".card-body").html("")
    for (let [key,values] of Object.entries(labels["category"])){
        $("#collapseOne").find(".card-body").append(`<div class="btn-group-toggle text-left h5 my-2" id="${key}" data-toggle="buttons">\
        <label class="mb-0 align-top filterLabel">${key}</label>\
        <label class="btn btn-secondary active all"><input type="radio" checked><h5 class=mb-0>All</h5></label>\
        <label class="btn btn-secondary none"><input type="radio"><h5 class=mb-0>None</h5></label>\
        <label class="btn btn-secondary dropdown-toggle choose"><input type="checkbox"></label>\
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
        <label class="btn btn-secondary active all"><input type="radio" checked><h5 class=mb-0>All</h5></label>\
        <label class="btn btn-secondary none"><input type="radio"><h5 class=mb-0>None</h5></label>\
        <label class="btn btn-secondary dropdown-toggle choose"><input type="checkbox"></label>\
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
        <label class="btn btn-secondary active all"><input type="radio" checked><h5 class=mb-0>All</h5></label>\
        <label class="btn btn-secondary none"><input type="radio"><h5 class=mb-0>None</h5></label>\
        <label class="btn btn-secondary dropdown-toggle choose"><input type="checkbox"></label>\
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
        <div class="col-md-9 col-xs-8"><input type="range" class="custom-range" name="hintCount" min="1" max="11" id="hintCount" value="${settings["hintCount"]}" oninput="hints.value=hintCount.value"></div>\
        <div class="col-md-1 col-xs-1"><h5 class=mb-0><output id="hints" name="hints" for="hintCount">${settings["hintCount"]}</output></h5></div></div>\
        <div class="btn-group-toggle text-left h5 my-2" id="clueSet" data-toggle="buttons">\
        <label class="mb-0 align-top filterLabel">Clue Set</label>\
        <label class="btn btn-secondary"><input type="radio" name="clueSet" value="1"><h5 class=mb-0>1</h5></label>\
        <label class="btn btn-secondary"><input type="radio" name="clueSet" value="2"><h5 class=mb-0>2</h5></label>\
        <label class="btn btn-secondary"><input type="radio" name="clueSet" value="3"><h5 class=mb-0>3</h5></label></div>`)
    // Converting the enter key on buttons and checkboxes to clicks to allow keyboard usage
    $(".btn").keypress(function(e){
        if (e.which === 13){
            $(this).click()
        }
    })
    $(".custom-control-input").keypress(function(e){
        if (e.which === 13){
            $(this).click()
        }
    })
    // Removing focus state from buttons, but only for mouse users.
    $(".btn").mouseout(function(){
        $(this).blur()
    })
    // There are no sub-filters for Regular show type, so remove the option.
    $("#Regular").find(".dropdown-toggle").addClass("d-none")
    // Show sub-filters on clicking dropdown button.
    $(".choose").click(function(){
        var id = $(this).parent().attr("id")
        $(`input[name="${id}"]`).each(function(){
            $(this).parent().toggleClass("d-none")
        })
    })
    // Check all sub-filter checkboxes on clicking "All" button (the reverse is also handled down below).
    $(".all").click(function(){
        var id = $(this).parent().attr("id")
        $(`input[name="${id}"]`).each(function(){
            $(this).prop("checked",true)
        })
    })
    // Uncheck all sub-filter checkboxes on clicking "None" button.
    $(".none").click(function(){
        var id = $(this).parent().attr("id")
        $(`input[name="${id}"]`).each(function(){
            $(this).prop("checked",false)
        })
    })
    // Activate "All", "None", or neither filter button depending on whether all, none, or some sub-filter checkboxes are checked.
    $(".custom-control-input").change(function(){
        var id = $(this).attr("name")
        if ($(`input[name="${id}"]:checked`).length == $(`input[name="${id}"]`).length){
            $(`div[id="${id}"`).find(".all").addClass("active")
            $(`div[id="${id}"`).find(".none").removeClass("active")
        } else if ($(`input[name="${id}"]:checked`).length == 0){
            $(`div[id="${id}"`).find(".all").removeClass("active")
            $(`div[id="${id}"`).find(".none").addClass("active")            
        } else {
            $(`div[id="${id}"`).find(".all").removeClass("active")
            $(`div[id="${id}"`).find(".none").removeClass("active")
        }
    })
    // Clean up the customization modal on smaller screens.
    if ($(window).width() < 500){
        $(".filterLabel").each(function(){
            $(this).after("<br>")
        })
    }
    // Activate clue set button manually, as there is a handler below to display a warning on change.
    $("#clueSet").find(`input[value="${settings["clueSet"]}"]`).click()
    $("input[type=radio][name=clueSet]").change(function(){
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
    $("#customizeSave").off().click(function(){
        settings = {"hintCount":$("form").serializeArray()[$("form").serializeArray().length - 2]['value'],"clueSet":$("form").serializeArray()[$("form").serializeArray().length - 1]['value']}
        // Create object out of customization form results.
        generateClue($("form").serializeArray(),settings)
    })
    $("#customizeReset").off().click(function(){
        buildCustomization(defaultSettings)
    })
}

// Initialize everything with clue set 1 on page load.
initApp();