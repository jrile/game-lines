"use strict";
const Alexa = require("alexa-sdk"); // import the library
var http = require('http');
var parseString = require('xml2js').parseString;
var util = require('util');
var AWS = require('aws-sdk');
var s3 = new AWS.S3({apiVersion: '2006-03-01'});
//=========================================================================================================================================
//TODO: The items below this comment need your attention
//=========================================================================================================================================

//Replace with your app ID (OPTIONAL).  You can find this value at the top of your skill's page on http://developer.amazon.com.
//Make sure to enclose your value in quotes, like this:  var APP_ID = "amzn1.ask.skill.bb4045e6-b3e8-4133-b650-72923c5980f1";
var APP_ID = undefined;

// =====================================================================================================
// --------------------------------- Section 1.  and Text strings  ---------------------------------
// =====================================================================================================
//TODO: Replace this  with your own.
//======================================================================================================


//======================================================================================================
//TODO: Replace these text strings to edit the welcome and help messages
//======================================================================================================
var S3_BUCKET_NAME = "gamelines";
var S3_ODDS_KEY = "gamelines";
var skillName = "Game Lines";

//This is the welcome message for when a user starts the skill without a specific intent.
var WELCOME_MESSAGE = "Welcome to " + skillName + ", find the line for an upcoming sport event. For example, " + getGenericHelpMessage();

//This is the message a user will hear when they ask Alexa for help in your skill.
var HELP_MESSAGE = "I can help you find spreads for sports events. ";

//This is the message a user will hear when they begin a new search
var NEW_SEARCH_MESSAGE = getGenericHelpMessage();

//This is the message a user will hear when they ask Alexa for help while in the SEARCH state
var SEARCH_STATE_HELP_MESSAGE = getGenericHelpMessage();

var DESCRIPTION_STATE_HELP_MESSAGE = "Here are some things you can say: Tell me more, or give me his or her contact info";

// This is the message use when the decides to end the search
var SHUTDOWN_MESSAGE = "Ok.";

//This is the message a user will hear when they try to cancel or stop the skill.
var EXIT_SKILL_MESSAGE = "Ok.";

// =====================================================================================================
// ------------------------------ Section 2. Skill Code - Intent Handlers  -----------------------------
// =====================================================================================================
// CAUTION: Editing anything below this line might break your skill.
//======================================================================================================

var states = {
	SEARCHMODE: "_SEARCHMODE",
	DESCRIPTION: "_DESCRIPTION"
};

const newSessionHandlers = {
	"LaunchRequest": function() {
		this.handler.state = states.SEARCHMODE;
		this.emit(":ask", WELCOME_MESSAGE, getGenericHelpMessage());
	},
	"SearchByTeamNameIntent": function() {
		console.log("SEARCH BY TEAM NAME INTENT");
		this.handler.state = states.SEARCHMODE;
		this.emitWithState("SearchByTeamNameIntent");
	},
	"TellMeMoreIntent": function() {
		this.handler.state = states.SEARCHMODE;
		this.emit(":ask", WELCOME_MESSAGE, getGenericHelpMessage());
	},
	"AMAZON.YesIntent": function() {
		this.emit(":ask", getGenericHelpMessage(), getGenericHelpMessage());
	},
	"AMAZON.NoIntent": function() {
		this.emit(":tell", SHUTDOWN_MESSAGE);
	},
	"AMAZON.RepeatIntent": function() {
		this.emit(":ask", HELP_MESSAGE, getGenericHelpMessage());
	},
	"AMAZON.StopIntent": function() {
		this.emit(":tell", EXIT_SKILL_MESSAGE);
	},
	"AMAZON.CancelIntent": function() {
		this.emit(":tell", EXIT_SKILL_MESSAGE);
	},
	"AMAZON.StartOverIntent": function() {
		this.handler.state = states.SEARCHMODE;
		var output = "Ok, starting over." + getGenericHelpMessage();
		this.emit(":ask", output, output);
	},
	"AMAZON.HelpIntent": function() {
		this.emit(":ask", HELP_MESSAGE + getGenericHelpMessage(), getGenericHelpMessage());
	},
	"SessionEndedRequest": function() {
		this.emit("AMAZON.StopIntent");
	},
	"Unhandled": function() {
		this.handler.state = states.SEARCHMODE;
		this.emitWithState("SearchByNameIntent");
	}
};
var startSearchHandlers = Alexa.CreateStateHandler(states.SEARCHMODE, {
	"AMAZON.YesIntent": function() {
		this.emit(":ask", NEW_SEARCH_MESSAGE, NEW_SEARCH_MESSAGE);
	},
	"AMAZON.NoIntent": function() {
		this.emit(":tell", SHUTDOWN_MESSAGE);
	},
	"AMAZON.RepeatIntent": function() {
		var output;
		if(this.attributes.lastSearch){
			output = this.attributes.lastSearch;
			console.log("repeating last speech");
		}
		else{
			output = getGenericHelpMessage();
			console.log("no last speech availble. outputting standard help message.");
		}
		this.emit(":ask",output, output);
	},
	"SearchByTeamNameIntent": function() {
		searchByTeamNameIntentHandler.call(this);
	},
	"SearchByNameIntent": function() {
		searchByNameIntentHandler.call(this);
	},
	"SearchByCityIntent": function() {
		searchByCityIntentHandler.call(this);
	},
	"SearchByInfoTypeIntent": function() {
		searchByInfoTypeIntentHandler.call(this);
	},
	"TellMeThisIntent": function() {
		this.handler.state = states.DESCRIPTION;
		this.emitWithState("TellMeThisIntent");
	},
	"TellMeMoreIntent": function() {
		this.handler.state = states.DESCRIPTION;
		this.emitWithState("TellMeMoreIntent");
	},
	"AMAZON.HelpIntent": function() {
		this.emit(":ask", getGenericHelpMessage(), getGenericHelpMessage());
	},
	"AMAZON.StopIntent": function() {
		this.emit(":tell", EXIT_SKILL_MESSAGE);
	},
	"AMAZON.CancelIntent": function() {
		this.emit(":tell", EXIT_SKILL_MESSAGE);
	},
	"SessionEndedRequest": function() {
		this.emit("AMAZON.StopIntent");
	},
	"Unhandled": function() {
		console.log("Unhandled intent in startSearchHandlers");
		this.emit(":ask", SEARCH_STATE_HELP_MESSAGE, SEARCH_STATE_HELP_MESSAGE);
	}
});
var descriptionHandlers = Alexa.CreateStateHandler(states.DESCRIPTION, {
	"TellMeMoreIntent": function() {
		var person;
		var speechOutput;
		var repromptSpeech;
		var cardContent;
		// TODO add a 'tell more' that says the odds, moneyline, etc.
		/*if(this.attributes.lastSearch){
			person = this.attributes.lastSearch.results[0];
			cardContent = generateCard(person); //calling the helper function to generate the card content that will be sent to the Alexa app.
			speechOutput = generateTellMeMoreMessage(person);
			repromptSpeech = "Would you like to find another evangelist? Say yes or no";

			console.log("the contact you're trying to find more info about is " + person.firstName);
			this.handler.state = states.SEARCHMODE;
			this.attributes.lastSearch.lastSpeech = speechOutput;
			this.emit(":askWithCard", speechOutput, repromptSpeech, cardContent.title, cardContent.body, cardContent.image);
		}
		else{
			speechOutput = getGenericHelpMessage();
			repromptSpeech = getGenericHelpMessage();
			this.handler.state = states.SEARCHMODE;
			this.emit(":ask", speechOutput, repromptSpeech);
		}*/
	},
	"AMAZON.HelpIntent": function() {
		var person = this.attributes.lastSearch.results[0];
		this.emit(":ask", generateNextPromptMessage(person,"current"), generateNextPromptMessage(person,"current"));
	},
	"AMAZON.StopIntent": function() {
		this.emit(":tell", EXIT_SKILL_MESSAGE);
	},
	"AMAZON.CancelIntent": function() {
		this.emit(":tell", EXIT_SKILL_MESSAGE);
	},
	"AMAZON.NoIntent": function() {
		this.emit(":tell", SHUTDOWN_MESSAGE);
	},
	"AMAZON.YesIntent": function() {
		this.emit("TellMeMoreIntent");
	},
	"AMAZON.RepeatIntent": function() {
		this.emit(":ask",this.attributes.lastSearch, this.attributes.lastSearch);
	},
	"SessionEndedRequest": function() {
		this.emit("AMAZON.StopIntent");
	},
	"Unhandled": function() {
		console.log("Unhandled intent in DESCRIPTION state handler");
		this.emit(":ask", "Sorry, I don't know that.");
	}
});

// ------------------------- END of Intent Handlers  ---------------------------------

function searchByTeamNameIntentHandler(/*for testing only!*/ t1) {
	// this should always be present:
	var teamOne = isSlotValid(this.event.request, "teamOne");
	
	var betPhrase = isSlotValid(this.event.request, "betPhrase");
	var teamTwo = isSlotValid(this.event.request, "teamTwo");
	var sportsEvent = isSlotValid(this.event.request, "sportEvent");
	if(t1) { teamOne = t1; }
	if(teamOne) {
		console.log("team one:", teamOne);
		if(betPhrase) {
			console.log("bet phrase:", betPhrase);
		}
		if(teamTwo) {
			// TODO handle if team one doesn't play team two and vice versa
			console.log("team two:", teamTwo);
		}
		if(sportsEvent) {
			// TODO eventually add other sports than NFL
			console.log("sports event:", sportsEvent);
		}
		var self = this;
		getAllLines(teamOne, function(retVal, teamParsed, league) {
			console.log("searchByTeamNameIntentHandler returning with", retVal);
			self.handler.state = states.DESCRIPTION;
				parseString(retVal, function(err, lines) {
					console.log("got", lines);
					if(!lines || !lines.Data || !lines.Data.Leagues) {
						console.error("No NFL spreads returned!");
						// TODO
					}
					var speech;
					for(var i = 0; i < lines.Data.Leagues[0].league.length; i++) {
						var leagueName = lines.Data.Leagues[0].league[i]['$'].IdSport;
						if(leagueName === league) {
							for(var j = 0; j < lines.Data.Leagues[0].league[i].game.length; j++) {
								var game = lines.Data.Leagues[0].league[i].game[j];
								console.log("game", game);
								var visitingTeam = game['$']['vtm'];
								var homeTeam = game['$']['htm'];
								if(visitingTeam === teamParsed) {
									var line = game.line[0]['$']['vsprdt'];
									speech = spreadToSpeech(line, teamParsed, homeTeam, true);
								} else if(homeTeam === teamParsed) {
									var line = game.line[0]['$']['hsprdt'];
									speech = spreadToSpeech(line, teamParsed, visitingTeam, false);
								}
							}
						}
					}
					// todo: states here
					if(!speech) {
						speech = getCouldntFindError(teamOne);
					}
					self.attributes.lastSearch = speech;
					console.log("Going to return: " + speech);
					// TODO: set last search info stuffs
					self.emit(":tell", speech);
				}); 
		}, function() {
			self.emit(":tell", getCouldntFindError(teamOne));
		});
	} else {
		console.log("Don't have team one to search!");
		this.emit(":ask", generateSearchResultsMessage(searchQuery,false));
	}
}


// =====================================================================================================
// ------------------------------- Section 3. Generating Speech Messages -------------------------------
// =====================================================================================================

function getGenericHelpMessage(){
	return "TODO THREE";
}

function getCouldntFindError(teamName) {
	if(!teamName) {
		teamName = "that team.";
	} else if(!teamName.toLowerCase().substring(0, 4).includes("the")) {
		teamName = "the " + teamName;
	}
	return "Sorry, I couldn't find odds for " + teamName + ".";
}

exports.handler = function(event, context, callback) {
	var alexa = Alexa.handler(event, context);
	alexa.appId = APP_ID;
	alexa.registerHandlers(newSessionHandlers, startSearchHandlers, descriptionHandlers);
	alexa.execute();
};

// =====================================================================================================
// ------------------------------------ Section 4. Helper Functions  -----------------------------------
// =====================================================================================================
// For more helper functions, visit the Alexa cookbook at https://github.com/alexa/alexa-cookbook
//======================================================================================================

// TODO: add team logos
function generateCard(person) {
	//var cardTitle = "Contact Info for " + titleCase(person.firstName) + " " + titleCase(person.lastName);
	var cardTitle = "TODO TWO";	
	var cardBody = "Twitter: " + "@" + person.twitter + " \n" + "GitHub: " + person.github + " \n" + "LinkedIn: " + person.linkedin;
	var imageObj = {
		smallImageUrl: "https://m.media-amazon.com/images/G/01/mobile-apps/dex/alexa/alexa-skills-kit/tutorials/team-lookup/avatars/" + person.firstName + "._TTH_.jpg",
		largeImageUrl: "https://m.media-amazon.com/images/G/01/mobile-apps/dex/alexa/alexa-skills-kit/tutorials/team-lookup/avatars/" + person.firstName + "._TTH_.jpg",
	};
	return {
		"title": cardTitle,
		"body": cardBody,
		"image": imageObj
	};
}

function isSlotValid(request, slotName){
	var slot = request.intent.slots[slotName];
	console.log("request = "+JSON.stringify(request)); //uncomment if you want to see the request
	var slotValue;

	//if we have a slot, get the text and store it into speechOutput
	if (slot && slot.value) {
		//we have a value in the slot
		slotValue = slot.value.toLowerCase();
		return slotValue;
	} else {
		//we didn't get a value in the slot.
		return false;
	}
}

function updateOdds(teamParsed, successCallback) {
	var xmlResponse = "";
	var options = {
		host : 'lines.bookmaker.eu',
		method : 'GET',
		port: 80,
		headers: {'user-agent': 'node.js'}
	};
	var req = http.request(options, function(resp) {
		resp.on('data', function(data) {
			xmlResponse += data;
		});
		resp.on('end', function() {
			//parseString(xmlResponse, function(err, result) {
				//console.log("got", result);
				var params = {
					//Body: result,
					Body: xmlResponse,
					Bucket:S3_BUCKET_NAME,
					Key:S3_ODDS_KEY
				};
				s3.putObject(params, function(err, data) {
					if(err) {
						console.error("Could not save to S3", err, err.stack);
					} else {
						console.log("Successfully saved to S3", data);
					}
					successCallback(xmlResponse, teamParsed, "NFL");
				});
			//});

		});
	});
	req.end();
	req.on('error', function(e) {
		console.error("request error", e);
	});
}

function getAllLines(team, successCallback, teamNotFoundCallback) {
	var teamParsed = getTeamName(team); 
	console.log("teamParsed", teamParsed);
	if(!teamParsed) {
		teamNotFoundCallback();
	}
	// TODO: don't request this every single time
	var params = {
		Bucket: S3_BUCKET_NAME,
		Key: S3_ODDS_KEY
	};	
	s3.getObject(params, function(err, data) {
		if(err) {
			console.log(err, err.stack);
			console.log("getting up to date line info");
			updateOdds(teamParsed, successCallback);
		} else {
			console.log("data", data);
			successCallback(data.Body.toString('ascii'), teamParsed, "NFL");
		}
	});

}

function spreadToSpeech(spread, teamOne, teamTwo, teamOneOnTheRoad) {
	var where = teamOneOnTheRoad ? "on the road" : "at home";
	if(spread === 0) {
		return "The " + teamOne + " are at even odds against the " + teamTwo + " " + where + ".";
	} else if(spread < 0) {
		return "The " + teamOne + " are " + (spread * -1) + " point favorites against the " + teamTwo + " " + where + ".";
	} else {
		return "The " + teamOne + " are " + spread + " point underdogs against the " + teamTwo + " " + where + ".";
	}
}

function getTeamName(input) {
	console.log("getTeamName", input);
	if(!input) {
		return null;
	}
	var i = input.toLowerCase();
	if(i.includes("arizona") || i.includes("cardinals")) {
		return "Arizona Cardinals";
	} else if(i.includes("atlanta") || i.includes("falcons")) {
		return "Atlanta Falcons";
	} else if(i.includes("baltimore") || i.includes("ravens")) {
		return "Baltimore Ravens";
	} else if(i.includes("buffalo") || i.includes("bills")) {
		return "Buffalo Bills";
	} else if(i.includes("carolina") || i.includes("panthers")) {
		return "Carolina Panthers";
	} else if(i.includes("chicago") || i.includes("bears")) {
		return "Chicago Bears";
	} else if(i.includes("cincinatti") || i.includes("bengals")) {
		return "Cincinatti Bengals";
	} else if(i.includes("cleveland") || i.includes("browns")) {
		return "Cleveland Browns";
	} else if(i.includes("dallas") || i.includes("cowboys")) {
		return "Dallas Cowboys";
	} else if(i.includes("denver") || i.includes("broncos")) {
		return "Denver Broncos";
	} else if(i.includes("detroit") || i.includes("lions")) {
		return "Detroit Lions";
	} else if(i.includes("green bay") || i.includes("packers")) {
		return "Green Bay Packers";
	} else if(i.includes("houston") || i.includes("texans") || i.includes("texas")) {
		return "Houston Texans";
	} else if(i.includes("indianapolis") || i.includes("colts")) {
		return "Indianapolis Colts";
	} else if(i.includes("jacksonville") || i.includes("jaguars")) {
		return "Jacksonville Jaguars";
	} else if(i.includes("kansas") || i.includes("chiefs")) {
		return "Kansas City Chiefs";
	} else if(i.includes("chargers")) {
		return "Los Angeles Chargers";
	} else if(i.includes("rams")) {
		return "Los Angeles Rams";
	} else if(i.includes("miami") || i.includes("dolphins")) {
		return "Miami Dolphins";
	} else if(i.includes("minnesota") || i.includes("vikings")) {
		return "Minnesota Vikings";
	} else if(i.includes("england") || i.includes("patriots")) {
		return "New England Patriots";
	} else if(i.includes("orleans") || i.includes("saints")) {
		return "New Orleans Saints";
	} else if(i.includes("giants")) {
		return "New York Giants";
	} else if(i.includes("jets")) {
		return "New York Jets";
	} else if(i.includes("oakland") || i.includes("raiders")) {
		return "Oakland Raiders";
	} else if(i.includes("philadelphia") || i.includes("eagles")) {
		return "Philadelphia Eagles";
	} else if(i.includes("pittsburgh") || i.includes("steelers")) {
		return "Pittsburgh Steelers";
	} 
	// TODO: test this
	else if(i.includes("san") || i.includes("francisco") || i.includes("forty niners")) {
		return "San Francisco 49ers";
	} else if(i.includes("seattle") || i.includes("seahawks")) {
		return "Seattle Seahawks";
	} else if(i.includes("tampa") || i.includes("bay") || i.includes("bucs") || i.includes("bucks") || i.includes("buccaneers")) {
		return "Tampa Bay Buccaneers";
	} else if(i.includes("tennessee") || i.includes("titans")) {
		return "Tennessee Titans";
	} else if(i.includes("washington") || i.includes("redskins") || i.includes("racists")) {
		return "Washington Redskins";
	} else {
		return null;
	}	
}
//getAllLines('steelers');
