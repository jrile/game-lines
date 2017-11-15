"use strict";
const Alexa = require("alexa-sdk"); // import the library
var http = require('http');
var parseString = require('xml2js').parseString;
var util = require('util');
var AWS = require('aws-sdk');
var s3 = new AWS.S3({apiVersion: '2006-03-01'});

var APP_ID = "amzn1.ask.skill.b012474e-0a43-4bf7-95a5-ca1496fe65fd";


var S3_BUCKET_NAME = "gamelines";
var S3_ODDS_KEY = "gamelines";
var HOURS_TO_KEEP_ODDS = 3;
var skillName = "Game Lines";

//This is the welcome message for when a user starts the skill without a specific intent.
var WELCOME_MESSAGE = "Welcome to " + skillName + ", find the line for an upcoming sport event. For example, " + getGenericHelpMessage();

//This is the message a user will hear when they ask Alexa for help in your skill.
var HELP_MESSAGE = "I can help you find spreads for sports events. ";

//This is the message a user will hear when they begin a new search
var NEW_SEARCH_MESSAGE = getGenericHelpMessage();

//This is the message a user will hear when they ask Alexa for help while in the SEARCH state
var SEARCH_STATE_HELP_MESSAGE = getGenericHelpMessage();

// This is the message use when the decides to end the search
var SHUTDOWN_MESSAGE = "Ok.";

//This is the message a user will hear when they try to cancel or stop the skill.
var EXIT_SKILL_MESSAGE = "Ok.";

// =====================================================================================================
// ------------------------------ Section 2. Skill Code - Intent Handlers  -----------------------------
// =====================================================================================================
// CAUTION: Editing anything below this line might break your skill.
//======================================================================================================


const newSessionHandlers = {
	"LaunchRequest": function() {
		this.emit(":ask", WELCOME_MESSAGE, getGenericHelpMessage());
	},
	"SearchByTeamNameIntent": function() {
		searchByTeamNameIntentHandler.call(this);
	},
	"AMAZON.RepeatIntent": function() {
		console.log("do we have old info here???", this.attributes.lastSearch);
		this.emit(":ask", HELP_MESSAGE, getGenericHelpMessage());
	},
	"AMAZON.StopIntent": function() {
		this.emit(":tell", EXIT_SKILL_MESSAGE);
	},
	"AMAZON.CancelIntent": function() {
		this.emit(":tell", EXIT_SKILL_MESSAGE);
	},
	"AMAZON.HelpIntent": function() {
		this.emit(":ask", HELP_MESSAGE + "For example, " + getGenericHelpMessage(), getGenericHelpMessage());
	},
	"SessionEndedRequest": function() {
		this.emit("AMAZON.StopIntent");
	},
	"Unhandled": function() {
		console.log("Unhandled intent in startSearchHandlers");
		this.emit(":ask", SEARCH_STATE_HELP_MESSAGE, SEARCH_STATE_HELP_MESSAGE);
	}
};

// ------------------------- END of Intent Handlers  ---------------------------------

function searchByTeamNameIntentHandler() {
	// this should always be present:
	console.log("request = "+JSON.stringify(this.event.request)); //uncomment if you want to see the request
	var teamOne = isSlotValid(this.event.request, "teamOne");
	
	var teamTwo = isSlotValid(this.event.request, "teamTwo");
	var sportsEvent = isSlotValid(this.event.request, "sportEvent");

	if(teamOne) {
		console.log("team one:", teamOne);
		if(teamTwo) {
			// TODO handle if team one doesn't play team two and vice versa
			console.log("team two:", teamTwo);
		}
		if(sportsEvent) {
			// TODO eventually add other sports than NFL
			console.log("sports event:", sportsEvent);
		}
		var self = this;
		getAllLines(teamOne, function(retVal, team, league) {
			console.log("searchByTeamNameIntentHandler returning with", retVal);
				parseString(retVal, function(err, lines) {
					console.log("got", lines);
					if(!lines || !lines.Data || !lines.Data.Leagues) {
						console.error("No NFL spreads returned!");
						// TODO
					}
					var found = false;
					var result = {"teamOne" : team};
					var teamParsed = team['name'];
					var speech;
					for(var i = 0; i < lines.Data.Leagues[0].league.length && !found; i++) {
						var leagueName = lines.Data.Leagues[0].league[i]['$'].IdSport;
						if(leagueName === league) {
							for(var j = 0; j < lines.Data.Leagues[0].league[i].game.length; j++) {
								var game = lines.Data.Leagues[0].league[i].game[j];
								console.log("game", game);
								var visitingTeam = game['$']['vtm'];
								var homeTeam = game['$']['htm'];
								if(visitingTeam === teamParsed) {
									var line = result['line'] = game.line[0]['$']['vsprdt'];
									if(line === '') {
										speech = noSpread(teamParsed, homeTeam);
									} else {
										speech = spreadToSpeech(line, teamParsed, homeTeam, true);
									}
									result['teamTwo']  = game.line[0]['$']['htm'];
									result['teamOneML'] = game.line[0]['$']['voddsh'];
									result['teamOneOdds'] = game.line[0]['$']['vsprdoddst'];
									result['teamTwoML'] = game.line[0]['$']['hoddsh'];
									result['teamTwoOdds'] = game.line[0]['$']['hsprdoddst'];
									found = true;									
								} else if(homeTeam === teamParsed) {
									var line = result['line'] = game.line[0]['$']['hsprdt'];
									if(line === '') {
										speech = noSpread(teamParsed, visitingTeam);
									} else {
										speech = spreadToSpeech(line, teamParsed, visitingTeam, false);
									}
									result['teamTwo']  = game.line[0]['$']['vtm'];
									result['teamOneML'] = game.line[0]['$']['hoddsh'];
									result['teamOneOdds'] = game.line[0]['$']['hsprdoddst'];
									result['teamTwoML'] = game.line[0]['$']['voddsh'];
									result['teamTwoOdds'] = game.line[0]['$']['vsprdoddst'];
									found = true;		
								}

								if(found) {
									result['ou'] = game.line[0]['$']['unt'];
									if(result['ou']) {
										speech += "The over under is at " + result['ou'] + ". ";
									}
									// todo: TMI?
									//if(result['teamOneML'] && result['teamTwoML']) {
									//	speech += teamParsed + " moneyline odds are " + result['teamOneML'] + ". ";
									//	speech += result['teamTwo'] + " moneyline odds are " + result['teamTwoML'] + ". ";
									//}
									break;
								}
							}
						}
					}
					if(!speech) {
						speech = getCouldntFindError(teamOne);
					}
					self.attributes.lastSearch = result;
					self.attributes.lastSearch.speech = speech;
					console.log("Going to return: " + speech);
// todo comment?
					var card = {
						"type" : "standard",
						"title" : teamParsed + " odds",
						"text" : speech.replace(". ", ".\n"),
						"image" : {
							"smallImageUrl" : team['img'],
							"largeImageUrl" : team['img']
						}
					};

					self.emit(":tellWithCard", speech, teamParsed + " odds", speech.replace(". ", ".\n"), team['img']);
				}); 
		}, function() {
			self.emit(":tell", getCouldntFindError(teamOne));
		});
	} else {
		console.log("Don't have team one to search!");
		this.emit(":ask", HELP_MESSAGE + "For example, " + getGenericHelpMessage());
	}
}


// =====================================================================================================
// ------------------------------- Section 3. Generating Speech Messages -------------------------------
// =====================================================================================================

function getGenericHelpMessage(){
	return "you can ask for 'the steelers,' or 'Pittsburgh.'";
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
	alexa.registerHandlers(newSessionHandlers);
	alexa.execute();
};

function isSlotValid(request, slotName){
	var slot = request.intent.slots[slotName];
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

function updateOdds(team, successCallback) {
	var xmlResponse = "";
	var options = {
		host : 'lines.bookmaker.eu',
		method : 'GET',
		port: 80,
		headers: {'user-agent': 'node.js'}
	};
	var req = http.request(options, function(resp) { // get odds in XML from sportsbook XML endpoint
		resp.on('data', function(data) {
			xmlResponse += data;
		});
		resp.on('end', function() {
			var params = {
				Body: xmlResponse,
				Bucket:S3_BUCKET_NAME,
				Key:S3_ODDS_KEY
			};
			s3.putObject(params, function(err, data) { // store plain XML in S3 for later retrieval.
				if(err) {
					console.error("Could not save to S3", err, err.stack);
				} else {
					console.log("Successfully saved to S3", data);
				}
				successCallback(xmlResponse, team, "NFL");
			});
		});
	});
	req.end();
	req.on('error', function(e) {
		console.error("request error", e);
	});
}

function getAllLines(team, successCallback, teamNotFoundCallback) {
	var teamObj = getNFLTeamName(team); 
	var teamParsed = teamObj ? teamObj['name'] : null;
	console.log("teamParsed", teamParsed);
	if(!teamParsed) {
		teamNotFoundCallback();
	}

	var params = {
		Bucket: S3_BUCKET_NAME,
		Key: S3_ODDS_KEY
	};	
	s3.getObject(params, function(err, data) {
		if(err) {
			console.log(err, err.stack);
			console.log("getting up to date line info");
			updateOdds(teamObj, successCallback);
		} else {
			console.log("data", data);
			var staleOdds = new Date(data.LastModified);
			staleOdds.setHours(staleOdds.getHours() + HOURS_TO_KEEP_ODDS);
			var timestamp = new Date();
			if(timestamp > staleOdds) {
				// odds are HOURS_TO_KEEP_ODDS hours old, update them.
				console.log("Odds were last updated: " + data.LastModified + ", timestamp now: " + timestamp + ", greater than " + HOURS_TO_KEEP_ODDS + ", updating.");
				updateOdds(teamObj, successCallback);
			} else {
				console.log("Odds were last updated: " + data.LastModified + ", timestamp now: " + timestamp + ", no need to update.");
				successCallback(data.Body.toString('ascii'), teamObj, "NFL");
			}
		}
	});

}

function spreadToSpeech(spread, teamOne, teamTwo, teamOneOnTheRoad) {
	console.log("spreadToSpeech");
	console.log(spread);
	var where = teamOneOnTheRoad ? "on the road" : "at home";
	if(spread === '0') {
		return "The " + teamOne + " are at even odds against the " + teamTwo + " " + where + ". ";
	} else if(spread < 0) {
		return "The " + teamOne + " are " + (spread * -1) + " point favorites against the " + teamTwo + " " + where + ". ";
	} else {
		return "The " + teamOne + " are " + spread + " point underdogs against the " + teamTwo + " " + where + ". ";
	}
}

function noSpread(teamOne, teamTwo) {
	return "We don't have odds for the " + teamOne + " against the " + teamTwo + " yet, please check again later. ";
}

function getNFLTeamName(input) {
	console.log("getNFLTeamName", input);
	if(!input) {
		return null;
	}
	var i = input.toLowerCase();
	if(i.includes("arizona") || i.includes("cardinals")) {
		return {name: "Arizona Cardinals", img: 'http://a.espncdn.com/combiner/i?img=/i/teamlogos/nfl/500/ari.png&h=700&w=700'};
	} else if(i.includes("atlanta") || i.includes("falcons")) {
		return {name: "Atlanta Falcons", img: 'http://a.espncdn.com/combiner/i?img=/i/teamlogos/nfl/500/atl.png&h=700&w=700'};
	} else if(i.includes("baltimore") || i.includes("ravens")) {
		return {name: "Baltimore Ravens", img: 'http://a.espncdn.com/combiner/i?img=/i/teamlogos/nfl/500/bal.png&h=700&w=700'};
	} else if(i.includes("buffalo") || i.includes("bills")) {
		return {name: "Buffalo Bills", img: 'http://a.espncdn.com/combiner/i?img=/i/teamlogos/nfl/500/buf.png&h=700&w=700'};
	} else if(i.includes("carolina") || i.includes("panthers")) {
		return {name: "Carolina Panthers", img: 'http://a.espncdn.com/combiner/i?img=/i/teamlogos/nfl/500/ari.png&h=700&w=700'};
	} else if(i.includes("chicago") || i.includes("bears")) {
		return {name: "Chicago Bears", img: 'http://a.espncdn.com/combiner/i?img=/i/teamlogos/nfl/500/chi.png&h=700&w=700'};
	} else if(i.includes("cincinatti") || i.includes("bengals")) {
		return {name: "Cincinatti Bengals", img: 'http://a.espncdn.com/combiner/i?img=/i/teamlogos/nfl/500/cin.png&h=700&w=700'};
	} else if(i.includes("cleveland") || i.includes("browns")) {
		return {name: "Cleveland Browns", img: 'http://a.espncdn.com/combiner/i?img=/i/teamlogos/nfl/500/cle.png&h=700&w=700'};
	} else if(i.includes("dallas") || i.includes("cowboys")) {
		return {name: "Dallas Cowboys", img: 'http://a.espncdn.com/combiner/i?img=/i/teamlogos/nfl/500/dal.png&h=700&w=700'};
	} else if(i.includes("denver") || i.includes("broncos")) {
		return {name: "Denver Broncos", img: 'http://a.espncdn.com/combiner/i?img=/i/teamlogos/nfl/500/den.png&h=700&w=700'};
	} else if(i.includes("detroit") || i.includes("lions")) {
		return {name: "Detroit Lions", img: 'http://a.espncdn.com/combiner/i?img=/i/teamlogos/nfl/500/det.png&h=700&w=700'};
	} else if(i.includes("green bay") || i.includes("packers")) {
		return {name: "Green Bay Packers", img: 'http://a.espncdn.com/combiner/i?img=/i/teamlogos/nfl/500/gb.png&h=700&w=700'};
	} else if(i.includes("houston") || i.includes("texans") || i.includes("texas")) {
		return {name: "Houston Texans", img: 'http://a.espncdn.com/combiner/i?img=/i/teamlogos/nfl/500/ari.png&h=700&w=700'};
	} else if(i.includes("indianapolis") || i.includes("colts")) {
		return {name: "Indianapolis Colts", img: 'http://a.espncdn.com/combiner/i?img=/i/teamlogos/nfl/500/ind.png&h=700&w=700'};
	} else if(i.includes("jacksonville") || i.includes("jaguars")) {
		return {name: "Jacksonville Jaguars", img: 'http://a.espncdn.com/combiner/i?img=/i/teamlogos/nfl/500/jax.png&h=700&w=700'};
	} else if(i.includes("kansas") || i.includes("chiefs")) {
		return {name: "Kansas City Chiefs", img: 'http://a.espncdn.com/combiner/i?img=/i/teamlogos/nfl/500/kc.png&h=700&w=700'};
	} else if(i.includes("chargers")) {
		return {name: "Los Angeles Chargers", img: 'http://a.espncdn.com/combiner/i?img=/i/teamlogos/nfl/500/lac.png&h=700&w=700'};
	} else if(i.includes("rams")) {
		return {name: "Los Angeles Rams", img: 'http://a.espncdn.com/combiner/i?img=/i/teamlogos/nfl/500/ari.png&h=700&w=700'};
	} else if(i.includes("miami") || i.includes("dolphins")) {
		return {name: "Miami Dolphins", img: 'http://a.espncdn.com/combiner/i?img=/i/teamlogos/nfl/500/mia.png&h=700&w=700'};
	} else if(i.includes("minnesota") || i.includes("vikings")) {
		return {name: "Minnesota Vikings", img: 'http://a.espncdn.com/combiner/i?img=/i/teamlogos/nfl/500/min.png&h=700&w=700'};
	} else if(i.includes("england") || i.includes("patriots")) {
		return {name: "New England Patriots", img: 'http://a.espncdn.com/combiner/i?img=/i/teamlogos/nfl/500/ne.png&h=700&w=700'};
	} else if(i.includes("orleans") || i.includes("saints")) {
		return {name: "New Orleans Saints", img: 'http://a.espncdn.com/combiner/i?img=/i/teamlogos/nfl/500/no.png&h=700&w=700'};
	} else if(i.includes("giants")) {
		return {name: "New York Giants", img: 'http://a.espncdn.com/combiner/i?img=/i/teamlogos/nfl/500/nyg.png&h=700&w=700'};
	} else if(i.includes("jets")) {
		return {name: "New York Jets", img: 'http://a.espncdn.com/combiner/i?img=/i/teamlogos/nfl/500/nyj.png&h=700&w=700'};
	} else if(i.includes("oakland") || i.includes("raiders")) {
		return {name: "Oakland Raiders", img: 'http://a.espncdn.com/combiner/i?img=/i/teamlogos/nfl/500/oak.png&h=700&w=700'};
	} else if(i.includes("philadelphia") || i.includes("eagles")) {
		return {name: "Philadelphia Eagles", img: 'http://a.espncdn.com/combiner/i?img=/i/teamlogos/nfl/500/phi.png&h=700&w=700'};
	} else if(i.includes("pittsburgh") || i.includes("steelers")) {
		return {name: "Pittsburgh Steelers", img: 'http://a.espncdn.com/combiner/i?img=/i/teamlogos/nfl/500/pit.png&h=700&w=700'};
	} 
	// TODO: test this
	else if(i.includes("san") || i.includes("francisco") || i.includes("forty niners")) {
		return {name: "San Francisco 49ers", img: 'http://a.espncdn.com/combiner/i?img=/i/teamlogos/nfl/500/sf.png&h=700&w=700'};
	} else if(i.includes("seattle") || i.includes("seahawks")) {
		return {name: "Seattle Seahawks", img: 'http://a.espncdn.com/combiner/i?img=/i/teamlogos/nfl/500/sea.png&h=700&w=700'};
	} else if(i.includes("tampa") || i.includes("bay") || i.includes("bucs") || i.includes("bucks") || i.includes("buccaneers")) {
		return {name: "Tampa Bay Buccaneers", img: 'http://a.espncdn.com/combiner/i?img=/i/teamlogos/nfl/500/tb.png&h=700&w=700'};
	} else if(i.includes("tennessee") || i.includes("titans")) {
		return {name: "Tennessee Titans", img: 'http://a.espncdn.com/combiner/i?img=/i/teamlogos/nfl/500/ten.png&h=700&w=700'};
	} else if(i.includes("washington") || i.includes("redskins") || i.includes("racists")) {
		return {name: "Washington Redskins", img: 'http://a.espncdn.com/combiner/i?img=/i/teamlogos/nfl/500/was.png&h=700&w=700'};
	} else {
		return null;
	}	
}
