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

var NFL_TEAMS = {
	"az": {name: "Arizona Cardinals", img: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/nfl/500/ari.png&h=700&w=700'},
	"atl": {name: "Atlanta Falcons", img: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/nfl/500/atl.png&h=700&w=700'},
	"bal": {name: "Baltimore Ravens", img: 'http://a.espncdn.com/combiner/i?img=/i/teamlogos/nfl/500/bal.png&h=700&w=700'},
	"buf": {name: "Buffalo Bills", img: 'http://a.espncdn.com/combiner/i?img=/i/teamlogos/nfl/500/buf.png&h=700&w=700'},
	"car": {name: "Carolina Panthers", img: 'http://a.espncdn.com/combiner/i?img=/i/teamlogos/nfl/500/ari.png&h=700&w=700'},
	"chi": {name: "Chicago Bears", img: 'http://a.espncdn.com/combiner/i?img=/i/teamlogos/nfl/500/chi.png&h=700&w=700'},
	"cin": {name: "Cincinatti Bengals", img: 'http://a.espncdn.com/combiner/i?img=/i/teamlogos/nfl/500/cin.png&h=700&w=700'},
	"cle": {name: "Cleveland Browns", img: 'http://a.espncdn.com/combiner/i?img=/i/teamlogos/nfl/500/cle.png&h=700&w=700'},
	"dal": {name: "Dallas Cowboys", img: 'http://a.espncdn.com/combiner/i?img=/i/teamlogos/nfl/500/dal.png&h=700&w=700'},
	"det": {name: "Denver Broncos", img: 'http://a.espncdn.com/combiner/i?img=/i/teamlogos/nfl/500/den.png&h=700&w=700'},
	"gb": {name: "Green Bay Packers", img: 'http://a.espncdn.com/combiner/i?img=/i/teamlogos/nfl/500/gb.png&h=700&w=700'},
	"hou": {name: "Houston Texans", img: 'http://a.espncdn.com/combiner/i?img=/i/teamlogos/nfl/500/ari.png&h=700&w=700'},
	"ind": {name: "Indianapolis Colts", img: 'http://a.espncdn.com/combiner/i?img=/i/teamlogos/nfl/500/ind.png&h=700&w=700'},
	"jax": {name: "Jacksonville Jaguars", img: 'http://a.espncdn.com/combiner/i?img=/i/teamlogos/nfl/500/jax.png&h=700&w=700'},
	"kc": {name: "Kansas City Chiefs", img: 'http://a.espncdn.com/combiner/i?img=/i/teamlogos/nfl/500/kc.png&h=700&w=700'},
	"lac": {name: "Los Angeles Chargers", img: 'http://a.espncdn.com/combiner/i?img=/i/teamlogos/nfl/500/lac.png&h=700&w=700'},
	"lar": {name: "Los Angeles Rams", img: 'http://a.espncdn.com/combiner/i?img=/i/teamlogos/nfl/500/ari.png&h=700&w=700'},
	"mia": {name: "Miami Dolphins", img: 'http://a.espncdn.com/combiner/i?img=/i/teamlogos/nfl/500/mia.png&h=700&w=700'},
	"min": {name: "Minnesota Vikings", img: 'http://a.espncdn.com/combiner/i?img=/i/teamlogos/nfl/500/min.png&h=700&w=700'},
	"ne": {name: "New England Patriots", img: 'http://a.espncdn.com/combiner/i?img=/i/teamlogos/nfl/500/ne.png&h=700&w=700'},
	"no": {name: "New Orleans Saints", img: 'http://a.espncdn.com/combiner/i?img=/i/teamlogos/nfl/500/no.png&h=700&w=700'},
	"nyg": {name: "New York Giants", img: 'http://a.espncdn.com/combiner/i?img=/i/teamlogos/nfl/500/nyg.png&h=700&w=700'},
	"nyj": {name: "New York Jets", img: 'http://a.espncdn.com/combiner/i?img=/i/teamlogos/nfl/500/nyj.png&h=700&w=700'},
	"oak": {name: "Oakland Raiders", img: 'http://a.espncdn.com/combiner/i?img=/i/teamlogos/nfl/500/oak.png&h=700&w=700'},
	"phi": {name: "Philadelphia Eagles", img: 'http://a.espncdn.com/combiner/i?img=/i/teamlogos/nfl/500/phi.png&h=700&w=700'},
	"pit": {name: "Pittsburgh Steelers", img: 'http://a.espncdn.com/combiner/i?img=/i/teamlogos/nfl/500/pit.png&h=700&w=700'},
	"sf": {name: "San Francisco 49ers", img: 'http://a.espncdn.com/combiner/i?img=/i/teamlogos/nfl/500/sf.png&h=700&w=700'},
	"sea": {name: "Seattle Seahawks", img: 'http://a.espncdn.com/combiner/i?img=/i/teamlogos/nfl/500/sea.png&h=700&w=700'},
	"tb": {name: "Tampa Bay Buccaneers", img: 'http://a.espncdn.com/combiner/i?img=/i/teamlogos/nfl/500/tb.png&h=700&w=700'},
	"ten": {name: "Tennessee Titans", img: 'http://a.espncdn.com/combiner/i?img=/i/teamlogos/nfl/500/ten.png&h=700&w=700'},
	"was": {name: "Washington Redskins", img: 'http://a.espncdn.com/combiner/i?img=/i/teamlogos/nfl/500/was.png&h=700&w=700'}
};


var NBA_TEAMS = {
	"atl": {name: "Atlanta Hawks"},
	"bos": {name: "Boston Celtics"},
	"bro": {name: "Brooklyn Nets"},
	"cha": {name: "Charlotte Hornets"},
	"chi": {name: "Chicago Bulls"},
	"cle": {name: "Cleveland Cavaliers"},
	"dal": {name: "Dallas Mavericks"},
	"den": {name: "Denver Mavericks"},
	"det": {name: "Detroit Pistons"},
	"gs": {name: "Golden State Warriors"},	
	"hou": {name: "Houston Rockets"},
	"ind": {name: "Indiana Pacers"},
	"lac": {name: "LA Clippers"},
	"lal": {name: "Los Angeles Lakers"},
	"mem": {name: "Memphis Grizzlies"},
	"mia": {name: "Miami Heat"},
	"mil": {name: "Milwaukee Bucks"},
	"min": {name: "Minnesota Timberwolves"},
	"no": {name: "New Orleans Pelicans"},
	"ny": {name: "New York Knicks"},
	"okc": {name: "Oklahoma City Thunder"},
	"orl": {name: "Orlando Magic"},
	"phi": {name: "Philadelphia 76ers"},
	"pho": {name: "Phoenix Suns"},
	"por": {name: "Portland Trail Blazers"},
	"sac": {name: "Sacramento Kings"},
	"sa": {name: "San Antonio Spurs"},
	"tor": {name: "Toronto Raptors"},
	"utah": {name: "Utah Jazz"}
};
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
		getAllLines(teamOne, teamTwo, sportsEvent, function(retVal, team, league) {
			console.log("searchByTeamNameIntentHandler returning with", retVal);
				parseString(retVal, function(err, lines) {
					console.log("got", lines);
					var found = false;
					if(!lines || !lines.Data || !lines.Data.Leagues) {
						console.error("No NFL spreads returned!");
						speech = getCouldntFindError(teamOne);
						found = true; // nothing to parse.
					}
					var result = {"teamOne" : team};
					var teamParsed = (team && team['team']) ? team['team']['name'] : null;
					var speech;
					for(var i = 0; i < lines.Data.Leagues[0].league.length && !found; i++) {
						var leagueName = lines.Data.Leagues[0].league[i]['$'].IdSport;
						if(leagueName === league) {
							for(var j = 0; j < lines.Data.Leagues[0].league[i].game.length; j++) {
								var game = lines.Data.Leagues[0].league[i].game[j];
								var visitingTeam = game['$']['vtm'];
								var homeTeam = game['$']['htm'];
								console.log("game", visitingTeam, homeTeam);
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
										speech += "The over under is " + result['ou'] + " points. ";
									}
									// todo: TMI?
									//if(result['teamOneML'] && result['teamTwoML']) {
									//	speech += teamParsed + " moneyline odds are " + result['teamOneML'] + ". ";
									//	speech += result['teamTwo'] + " moneyline odds are " + result['teamTwoML'] + ". ";
									//}
									console.log("Result", result);
									break;
								}
							}
							break;
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

function updateOdds(team, league, successCallback) {
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
				successCallback(xmlResponse, team, league);
			});
		});
	});
	req.end();
	req.on('error', function(e) {
		console.error("request error", e);
	});
}

function getAllLines(teamOne, teamTwo, sportsEvent, successCallback, teamNotFoundCallback) {

	var teamObj;
	var league;

	if(sportsEvent) {
		if(sportsEvent.includes("college") || sportsEvent.includes("n. c. a. a.") || sportsEvent.includes("NCAA")) {
			// TODO
			if(sportsEvent.includes("basketball")) {
				
			} else {
				// default to football
			}
		} else if(sportsEvent.includes("n. f. l.") || sportsEvent.includes("NFL") || sportsEvent.includes("NF L") sportsEvent.includes("football")) {
			teamObj = getNFLTeamName(teamOne);
			league = "NFL";
		} else if(sportsEvent.includes("n. b. a.") || sportsEvent.includes("NBA") || sportsEvent.includes("NB A") || sportsEvent.includes("basketball")) {
			teamObj = getNBATeamName(teamOne);
			league = "NBA";
		} 
	} else if(teamTwo) {
		// try NFL first.
		var t1 = getNFLTeamName(teamOne);
		if(t1 && (t1.exactMatch || getNFLTeamName(teamTwo))) {
			teamObj = t1;
			league = "NFL";	
		} 

		if(!teamObj) {
			// try NBA
			t1 = getNBATeamName(teamOne);
			if(t1 && (t1.exactMatch || getNBATeamName(teamTwo))) {
				teamObj = t1;
				league = "NBA";
			}
		}

		if(!teamObj) {
			// TODO
			// try NCAA
		}
	} else {
		// we only have 1 team name to work with.
		var nbaTeam = getNBATeamName(teamOne);
		if(nbaTeam && nbaTeam.exactMatch) {
			teamObj = nbaTeam;
			league = "NBA";
		} else {
			// default to attempting NFL
			teamObj = getNFLTeamName(teamOne);
			league = "NFL";
		}	
		// TODO college
	}
	if(!teamObj) {
		teamNotFoundCallback();
	} else {
		console.log("league", league, "teamObj", teamObj);
	}

	var params = {
		Bucket: S3_BUCKET_NAME,
		Key: S3_ODDS_KEY
	};	
	s3.getObject(params, function(err, data) {
		if(err) {
			console.log(err, err.stack);
			console.log("getting up to date line info");
			updateOdds(teamObj, league, successCallback);
		} else {
			console.log("data", data);
			var staleOdds = new Date(data.LastModified);
			staleOdds.setHours(staleOdds.getHours() + HOURS_TO_KEEP_ODDS);
			var timestamp = new Date();
			if(timestamp > staleOdds) {
				// odds are HOURS_TO_KEEP_ODDS hours old, update them.
				console.log("Odds were last updated: " + data.LastModified + ", timestamp now: " + timestamp + ", greater than " + HOURS_TO_KEEP_ODDS + ", updating.");
				updateOdds(teamObj, league, successCallback);
			} else {
				console.log("Odds were last updated: " + data.LastModified + ", timestamp now: " + timestamp + ", no need to update.");
				successCallback(data.Body.toString('ascii'), teamObj, league);
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

function getNBATeamName(input) {
	console.log("getNBATeamName");
	if(!input) {
		return null;
	}
	var i = input.toLowerCase();	
	
	if(i.includes("hawks")) {
		return {team: NBA_TEAMS["atl"], exactMatch: true};
	} else if(i.includes("atlanta")) {
		return {team: NBA_TEAMS["atl"], exactMatch: false};
	} else if(i.includes("celtics")) {
		return {team: NBA_TEAMS["bos"], exactMatch: true};
	} else if(i.includes("boston")) {
		return {team: NBA_TEAMS["bos"], exactMatch: false};
	}  else if(i.includes("hornets")) {
		return {team: NBA_TEAMS["cha"], exactMatch: true};
	} else if(i.includes("hornets")) {
		return {team: NBA_TEAMS["cha"], exactMatch: false};
	} else if(i.includes("nets")) { // needs to be AFTER hornets.
		return {team: NBA_TEAMS["bro"], exactMatch: true};
	} else if(i.includes("brooklyn")) {
		return {team: NBA_TEAMS["bro"], exactMatch: false};
	} else if(i.includes("bulls")) {
		return {team: NBA_TEAMS["chi"], exactMatch: true};
	} else if(i.includes("chicago")) {
		return {team: NBA_TEAMS["chi"], exactMatch: false};
	} else if(i.includes("cavaliers")) {
		return {team: NBA_TEAMS["cle"], exactMatch: true};
	} else if(i.includes("cleveland")) {
		return {team: NBA_TEAMS["cle"], exactMatch: false};
	} else if(i.includes("mavericks")) {
		return {team: NBA_TEAMS["dal"], exactMatch: true};
	} else if(i.includes("dallas")) {
		return {team: NBA_TEAMS["dal"], exactMatch: false};
	} else if(i.includes("nuggets")) {
		return {team: NBA_TEAMS["den"], exactMatch: true};
	} else if(i.includes("denver")) {
		return {team: NBA_TEAMS["den"], exactMatch: false};
	} else if(i.includes("pistons")) {
		return {team: NBA_TEAMS["det"], exactMatch: true};
	} else if(i.includes("detroit")) {
		return {team: NBA_TEAMS["det"], exactMatch: false};
	} else if(i.includes("warriors")) {
		return {team: NBA_TEAMS["gs"], exactMatch: true};
	} else if(i.includes("golden")) {
		return {team: NBA_TEAMS["gs"], exactMatch: false};
	} else if(i.includes("rockets")) {
		return {team: NBA_TEAMS["hou"], exactMatch: true};
	} else if(i.includes("houston")) {
		return {team: NBA_TEAMS["hou"], exactMatch: false};
	} else if(i.includes("pacers")) {
		return {team: NBA_TEAMS["ind"], exactMatch: true};
	} else if(i.includes("indiana")) {
		return {team: NBA_TEAMS["ind"], exactMatch: false};
	} else if(i.includes("clippers")) {
		return {team: NBA_TEAMS["lac"], exactMatch: true};
	} else if(i.includes("lakers")) {
		return {team: NBA_TEAMS["lal"], exactMatch: true};
	} else if(i.includes("grizzlies") || i.includes("grizzly")) {
		return {team: NBA_TEAMS["mem"], exactMatch: true};
	} else if(i.includes("memphis")) {
		return {team: NBA_TEAMS["mem"], exactMatch: false};
	} else if(i.includes("heat")) {
		return {team: NBA_TEAMS["mia"], exactMatch: true};
	} else if(i.includes("miami")) {
		return {team: NBA_TEAMS["mia"], exactMatch: false};
	} else if(i.includes("bucks")) {
		return {team: NBA_TEAMS["mil"], exactMatch: true};
	} else if(i.includes("milwaukee")) {
		return {team: NBA_TEAMS["mil"], exactMatch: false};
	} else if(i.includes("timber") || i.includes("wolves")) {
		return {team: NBA_TEAMS["min"], exactMatch: true};
	} else if(i.includes("minnesota")) {
		return {team: NBA_TEAMS["min"], exactMatch: false};
	} else if(i.includes("pelicans")) {
		return {team: NBA_TEAMS["no"], exactMatch: true};
	} else if(i.includes("orleans")) {
		return {team: NBA_TEAMS["no"], exactMatch: false};
	} else if(i.includes("nicks")) {
		return {team: NBA_TEAMS["ny"], exactMatch: true};
	} else if(i.includes("york")) {
		return {team: NBA_TEAMS["ny"], exactMatch: false};
	} else if(i.includes("thunder")) {
		return {team: NBA_TEAMS["okc"], exactMatch: true};
	} else if(i.includes("oklahoma")) {
		return {team: NBA_TEAMS["okc"], exactMatch: false};
	} else if(i.includes("magic")) {
		return {team: NBA_TEAMS["orl"], exactMatch: true};
	} else if(i.includes("orlando")) {
		return {team: NBA_TEAMS["orl"], exactMatch: false};
	} else if(i.includes("seventy") || i.includes("sixers")) {
		return {team: NBA_TEAMS["phi"], exactMatch: true};
	} else if(i.includes("philadelphia") || i.includes("philly")) {
		return {team: NBA_TEAMS["phi"], exactMatch: false};
	} else if(i.includes("suns")) {
		return {team: NBA_TEAMS["pho"], exactMatch: true};
	} else if(i.includes("phoenix")) {
		return {team: NBA_TEAMS["pho"], exactMatch: false};
	} else if(i.includes("trail") || i.includes("blazer")) {
		return {team: NBA_TEAMS["por"], exactMatch: true};
	} else if(i.includes("portland")) {
		return {team: NBA_TEAMS["por"], exactMatch: false};
	} else if(i.includes("kings")) {
		return {team: NBA_TEAMS["sac"], exactMatch: true};
	} else if(i.includes("sacramento")) {
		return {team: NBA_TEAMS["sac"], exactMatch: false};
	} else if(i.includes("spurs")) {
		return {team: NBA_TEAMS["sa"], exactMatch: true};
	} else if(i.includes("antonio")) {
		return {team: NBA_TEAMS["sa"], exactMatch: false};
	} else if(i.includes("raptors")) {
		return {team: NBA_TEAMS["tor"], exactMatch: true};
	} else if(i.includes("toronto")) {
		return {team: NBA_TEAMS["tor"], exactMatch: false};
	} else if(i.includes("jazz")) {
		return {team: NBA_TEAMS["utah"], exactMatch: true};
	} else if(i.includes("utah")) {
		return {team: NBA_TEAMS["utah"], exactMatch: false};
	} else if(i.includes("angeles")) {
		return {team: NBA_TEAMS["lal"], exactMatch: false}; // sorry clippers
	} else {
		return null;
	}
}

// TODO: if given a unique city, return exact match immediately
function getNFLTeamName(input) {
	console.log("getNFLTeamName");
	if(!input) {
		return null;
	}
	var i = input.toLowerCase();

	if(i.includes("cardinals")) {
		return {team: NFL_TEAMS["az"], exactMatch: true};
	} else if(i.includes("arizona")) {
		return {team: NFL_TEAMS["az"], exactMatch: false};
	} else if(i.includes("falcons")) {
		return {team: NFL_TEAMS["atl"], exactMatch: true};
	} else if(i.includes("atlanta")) {
		return {team: NFL_TEAMS["atl"], exactMatch: false};
	} else if(i.includes("ravens")) {
		return {team: NFL_TEAMS["bal"], exactMatch: true};
	} else if(i.includes("baltimore")) {
		return {team: NFL_TEAMS["bal"], exactMatch: false};
	} else if(i.includes("bills")) {
		return {team: NFL_TEAMS["buf"], exactMatch: true};
	} else if(i.includes("buffalo")) {
		return {team: NFL_TEAMS["buf"], exactMatch: false};
	} else if(i.includes("panthers")) {
		return {team: NFL_TEAMS["car"], exactMatch: true};
	} else if(i.includes("carolina")) {
		return {team: NFL_TEAMS["car"], exactMatch: false};
	} else if(i.includes("bears")) {
		return {team: NFL_TEAMS["chi"], exactMatch: true};
	} else if(i.includes("chicago")) {
		return {team: NFL_TEAMS["chi"], exactMatch: false};
	} else if(i.includes("bengals")) {
		return {team: NFL_TEAMS["cin"], exactMatch: true};
	} else if(i.includes("cincinatti")) {
		return {team: NFL_TEAMS["cin"], exactMatch: false};
	} else if(i.includes("browns")) {
		return {team: NFL_TEAMS["cle"], exactMatch: true};
	} else if(i.includes("cleveland")) {
		return {team: NFL_TEAMS["cle"], exactMatch: false};
	} else if(i.includes("cowboys")) {
		return {team: NFL_TEAMS["dal"], exactMatch: true};
	} else if(i.includes("dallas")) {
		return {team: NFL_TEAMS["dal"], exactMatch: false};
	} else if(i.includes("broncos")) {
		return {team: NFL_TEAMS["den"], exactMatch: true};
	} else if(i.includes("denver")) {
		return {team: NFL_TEAMS["den"], exactMatch: false};
	} else if(i.includes("lions")) {
		return {team: NFL_TEAMS["det"], exactMatch: true};
	} else if(i.includes("detroit")) {
		return {team: NFL_TEAMS["det"], exactMatch: false};
	} else if(i.includes("packers")) {
		return {team: NFL_TEAMS["gb"], exactMatch: true};
	} else if(i.includes("green bay")) {
		return {team: NFL_TEAMS["gb"], exactMatch: false};
	} else if(i.includes("texans") || i.includes("texas")) {
		return {team: NFL_TEAMS["hou"], exactMatch: true};
	} else if(i.includes("houston")) {
		return {team: NFL_TEAMS["hou"], exactMatch: false};
	} else if(i.includes("colts")) {
		return {team: NFL_TEAMS["ind"], exactMatch: true};
	} else if(i.includes("indianapolis")) {
		return {team: NFL_TEAMS["ind"], exactMatch: false};
	} else if(i.includes("jaguars") || i.includes("jags")) {
		return {team: NFL_TEAMS["jax"], exactMatch: true};
	} else if(i.includes("jacksonville")) {
		return {team: NFL_TEAMS["jax"], exactMatch: false};
	} else if(i.includes("chiefs")) {
		return {team: NFL_TEAMS["kc"], exactMatch: true};
	} else if(i.includes("kansas city")) {
		return {team: NFL_TEAMS["kc"], exactMatch: false};
	} else if(i.includes("chargers")) {
		return {team: NFL_TEAMS["lac"], exactMatch: true};
	} else if(i.includes("rams")) {
		return {team: NFL_TEAMS["lar"], exactMatch: true};
	} else if(i.includes("dolphins")) {
		return {team: NFL_TEAMS["mia"], exactMatch: true};
	} else if(i.includes("miami")) {
		return {team: NFL_TEAMS["mia"], exactMatch: false};
	} else if(i.includes("vikings")) {
		return {team: NFL_TEAMS["min"], exactMatch: true};
	} else if(i.includes("minnesota")) {
		return {team: NFL_TEAMS["min"], exactMatch: false};
	} else if(i.includes("patriots")) {
		return {team: NFL_TEAMS["ne"], exactMatch: true};
	} else if(i.includes("england")) {
		return {team: NFL_TEAMS["ne"], exactMatch: false};
	} else if(i.includes("saints")) {
		return {team: NFL_TEAMS["no"], exactMatch: true};
	} else if(i.includes("orleans")) {
		return {team: NFL_TEAMS["no"], exactMatch: false};
	} else if(i.includes("giants")) {
		return {team: NFL_TEAMS["nyg"], exactMatch: true};
	} else if(i.includes("jets")) {
		return {team: NFL_TEAMS["nyj"], exactMatch: true};
	} else if(i.includes("raiders")) {
		return {team: NFL_TEAMS["oak"], exactMatch: true};
	} else if(i.includes("oakland")) {
		return {team: NFL_TEAMS["oak"], exactMatch: false};
	} else if(i.includes("eagles")) {
		return {team: NFL_TEAMS["phi"], exactMatch: true};
	} else if(i.includes("philadelphia")) {
		return {team: NFL_TEAMS["phi"], exactMatch: false};
	} else if(i.includes("steelers")) {
		return {team: NFL_TEAMS["pit"], exactMatch: true};
	} else if(i.includes("pittsburgh")) {
		return {team: NFL_TEAMS["pit"], exactMatch: false};
	} else if(i.includes("forty niner")) {
		return {team: NFL_TEAMS["sf"], exactMatch: true};
	} else if(i.includes("san fran") || i.includes("francisco")) {
		return {team: NFL_TEAMS["sf"], exactMatch: false};
	} else if(i.includes("seahawks")) {
		return {team: NFL_TEAMS["sea"], exactMatch: true};
	} else if(i.includes("seattle")) {
		return {team: NFL_TEAMS["sea"], exactMatch: false};
	} else if(i.includes("buccaneers") || i.includes("bucks")) {
		return {team: NFL_TEAMS["tb"], exactMatch: true};
	} else if(i.includes("tampa")) {
		return {team: NFL_TEAMS["tb"], exactMatch: false};
	} else if(i.includes("titans")) {
		return {team: NFL_TEAMS["ten"], exactMatch: true};
	} else if(i.includes("tennessee")) {
		return {team: NFL_TEAMS["ten"], exactMatch: false};
	} else if(i.includes("redskins") || i.includes("racists")) {
		return {team: NFL_TEAMS["was"], exactMatch: true};
	} else if(i.includes("washington") || i.includes("d. c.") || i.includes("DC")) {
		return {team: NFL_TEAMS["was"], exactMatch: false};
	}
	// defaults on states w/ multiple teams (sorry jets and chargers)
	else if(i.includes("new york")) {
		return {team: NFL_TEAMS["nyg"], exactMatch: false};
	} else if(i.includes("los angeles") || i.includes("l. a.") || i.includes("LA")) {
		return {team: NFL_TEAMS["lar"], exactMatch: false};
	} else {
		return null;
	}	
}
