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
var WELCOME_MESSAGE = "Welcome to " + skillName + ", find the line for an upcoming sport event. " + getGenericHelpMessage();

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
	"utah": {name: "Utah Jazz"},
	"was" : {name: "Washington Wizards"}
};

var NCAA_TEAMS = {
	"af" : {name: "Air Force", football: true},
	"ak" : {name: "Akron", football: true},
	"al" : {name: "Alabama", football: true},
	"am" : {name: "American", football: false},
	"apst" : {name: "Appalachian State", football: true},
	"az" : {name: "Arizona", football: true},
	"azst" : {name: "Arizona State", football: true},
	"ark" : {name: "Arkansas", football: true},
	"arkst" : {name: "Arkansas State", football: true},
	"army" : {name: "Army", football: true},
	"aub" : {name: "Auburn", football: true},
	"ballst" : {name: "Ball State", football: true},
	"bay" : {name: "Baylor", football: true},
	"bel" : {name: "Belmont", football: false},
	"bin" : {name: "Binghamton", football: false},
	"boi" : {name: "Boise State", football: true},
	"bc" : {name: "Boston College", football: true},
	"bg" : {name: "Bowling Green", football: true},
	"bos" : {name: "Boston", football: false},
	"bra" : {name: "Bradley", football: false},
	"buf" : {name: "Buffalo", football: true},
	"byu" : {name: "BYU", football: true},
	"cal" : {name: "California", football: true},
	"calbak" : {name: "Cal State Bakersfield", football: false}, // todo
	"calful" : {name: "Cal State Fullerton", football: false}, // todo
	"calnor" : {name: "CS Northridge", football: false},
	"can" : {name: "Canisius", football: false},
	"cc" : {name: "Coastal Carolina", football: true},
	"cha" : {name: "Charlotte", football: true},
	"ch" : {name: "Charleston", football: false},
	"chist" : {name: "Chicago State", football: false},
	"cin" : {name: "Cincinnati", football: true},
	"cle" : {name: "Clemson", football: true},
	"clest" : {name: "Cleveland State", football: false},
	"cmi" : {name: "Central Michigan", football: true},
	"col" : {name: "Colorado", football: true},
	"colst" : {name: "Colorado State", football: true},
	"con" : {name: "Connecticut", football: true},
	"cre" : {name: "Creighton", football: false},
	"den" : {name: "Denver", football: false},
	"dep" : {name: "DePaul", football: false},
	"det" : {name: "Detroit University", football: false},
	"dre" : {name: "Drexel", football: false},
	"duke" : {name: "Duke", football: true},
	"ec" : {name: "East Carolina", football: true},
	"em" : {name: "Eastern Michigan", football: true},
	"ev" : {name: "Evansville", football: false},
	"fai" : {name: "Fairfield", football: false},
	"fiu" : {name: "FIU", football: true}, // todo
	"fl" : {name: "Florida", football: true},
	"fla" : {name: "Florida Atlantic", football: true},
	"flgc" : {name: "Florida Gulf Coast", football: false},
	"flst" : {name: "Florida State", football: true},
	"fo" : {name: "Fort Wayne", football: false},
	"fresno" : {name: "Fresno State", football: true},
	"geom" : {name: "George Mason", football: false},
	"geow" : {name: "George Washington", football: false},
	"ga": {name: "Georgia", football: true},
	"gast" : {name: "Georgia State", football: true},
	"gatech" : {name: "Georgia Tech", football: true},
	"gon" : {name: "Gonzaga", football: false},
	"gra" : {name: "Grand Canyon", football: false},
	"gb" : {name: "Green Bay", football: false},
	"haw" : {name: "Hawaii", football: true},
	"hp" : {name: "High Point", football: false},
	"hof" : {name: "Hofstra", football: false},
	"hou" : {name: "Houston University", football: true},
	"id" : {name: "Idaho", football: true},
	"il" : {name: "Illinois", football: true},
	"ind" : {name: "Indiana", football: true},
	"ia" : {name: "Iowa", football: true},
	"iast" : {name: "Iowa State", football: true},
	"iona" : {name: "Iona", football: false},
	"iupui" : {name: "IUPUI", football: false}, // todo
	"kan" : {name: "Kansas", football: true},
	"kst" : {name: "Kansas State", football: true},
	"kentst" : {name: "Kent State", football: true},
	"kent" : {name: "Kentucky", football: true},
	"lsu" : {name: "LSU", football: true},
	"las" : {name: "La Salle", football: false}, // todo
	"lip" : {name: "Lipscomb", football: false},
	"lit" : {name: "Little Rock", football: false},
	"liu" : {name: "LIU Brooklyn", football: false}, // todo
	"lb" : {name: "Long Beach State", football: false},
	"lon" : {name: "Longwood", football: false},
	"latech" : {name: "Louisiana Tech", football: true},
	"lala" : {name: "UL Lafayette", football: true},
	"lamo" : {name: "UL Monroe", football: true}, 
	"lou" : {name: "Louisville", football: true},
	"loyc" : {name: "Loyola Chicago", football: false}, // todo
	"loymd" : {name: "Loyola Maryland", football: false}, // todo
	"loym" : {name: "Loyola Marymount", football: false}, // todo
	"man" : {name: "Manhattan", football: false}, 
	"marq" : {name: "Marquette", football: false},
	"mars" : {name: "Marshall", football: true},
	"md" : {name: "Maryland", football: true},
	"mdes" : {name: "Maryland Eastern Shore", football: false}, // todo
	"mass" : {name: "Massachusetts", football: true},
	"mem" : {name: "Memphis", football: true},
	"miafl" : {name: "Miami Florida", football: true},
	"miaoh" : {name: "Miami Ohio", football: true},
	"mi" : {name: "Michigan", football: true},
	"mist" : {name: "Michigan State", football: true},
	"midtenn" : {name: "Middle Tennessee", football: true},
	"milw" : {name: "Milwaukee", football: false},
	"minn" : {name: "Minnesota University", football: true},
	"ms" : {name: "Ole Miss", football: true}, // todo
	"msst" : {name: "Mississippi State", football: true},
	"mo" : {name: "Missouri", football: true},
	"msm" : {name: "Mount Saint Marys", football: false}, // todo
	"navy" : {name: "Navy", football: true},
	"neb" : {name: "Nebraska", football: true},
	"nev" : {name: "Nevada", football: true},
	"nm" : {name: "New Mexico", football: true},
	"nmst" : {name: "New Mexico State", football: true},
	"nia" : {name: "Niagara", football: false},
	"njit" : {name: "NJIT", football: false}, // todo
	"nc" : {name: "North Carolina", football: true},
	"ncst" : {name: "North Carolina State", football: true},
	"nfl" : {name: "North Florida", football: false},
	"ne" : {name: "Northeastern", football: false},
	"nky" : {name: "Northern Kentucky", football: false},
	"nt" : {name: "North Texas", football: true},
	"niu" : {name: "NIU", football: true}, // todo
	"nw" : {name: "Northwestern", football: true},
	"nd" : {name: "Notre Dame", football: true},
	"oak" : {name: "Oakland", football: false},
	"oh" : {name: "Ohio", football: true},
	"ohst" : {name: "Ohio State", football: true},
	"ok" : {name: "Oklahoma", football: true},
	"okst" : {name: "Oklahoma State", football: true},
	"od" : {name: "Old Dominion", football: true},
	"oma" : {name: "Omaha", football: false},
	"ora" : {name: "Oral Roberts", football: false},
	"or" : {name: "Oregon", football: true},
	"orst" : {name: "Oregon State", football: true},
	"pac" : {name: "Pacific", football: false},
	"ps" : {name: "Penn State", football: true},
	"pep" : {name: "Pepperdine", football: false},
	"pit" : {name: "Pittsburgh", football: true},
	"por" : {name: "Portland University", football: false},
	"pro" : {name: "Providence", football: false},
	"pur" : {name: "Purdue", football: true},
	"qui" : {name: "Quinnipiac", football: false},
	"rad" : {name: "Radford", football: false},
	"rice" : {name: "Rice", football: true},
	"rid" : {name: "Rider", football: false},
	"rut" : {name: "Rutgers Scarlet", football: true},
	"stb" : {name: "St. Bonaventure", football: false}, // todo
	"stf" : {name: "St. Francis Brooklyn", football: false}, // todo
	"stj" : {name: "Saint Johns", football: false}, // todo
	"stjoe" : {name: "Saint Josephs", football: false}, // todo
	"stl" : {name: "Saint Louis", football: false}, // todo
	"stm" : {name: "Saint Marys CA", football: false}, 
	"stp" : {name: "Saint Peters", football: false},
	"sdst" : {name: "San Diego State", football: true},
	"sanf" : {name: "San Francisco", football: false},
	"sjst" : {name: "San Jose State", football: true},
	"sant" : {name: "Santa Clara", football: false},
	"sea" : {name: "Seattle", football: false},
	"set" : {name: "Seton Hall", football: false},
	"sie" : {name: "Siena", football: false},
	"siu" : {name: "SIU Edwardsville", football: false},
	"smu" : {name: "SMU", football: true},
	"sal" : {name: "South Alabama", football: true},
	"sc" : {name: "South Carolina", football: true},
	"scu" : {name: "South Carolina Upstate", football: false},
	"usf" : {name: "South Florida", football: true},
	"smi" : {name: "Southern Miss", football: true},
	"sta" : {name: "Stanford", football: true},
	"syr" : {name: "Syracuse", football: true},
	"tcu" : {name: "TCU", football: true},
	"tem" : {name: "Temple", football: true},
	"ten" : {name: "Tennessee", football: true},
	"tex" : {name: "Texas", football: true},
	"texam" : {name: "Texas A&M", football: true},
	"texamcc": {name: "Texas A&M Corpus Christi", football: false}, // todo
	"texar" : {name: "UT Arlington", football: false},
	"texst" : {name: "Texas State", football: true},
	"textc" : {name: "Texas Tech", football: true},
	"tol" : {name: "Toledo", football: true},
	"troy" : {name: "Troy", football: true},
	"tula" : {name: "Tulane", football: true},
	"tuls" : {name: "Tulsa", football: true},
	"uab" : {name: "UAB", football: true},
	"ucr" : {name: "Cal Riverside", football: false}, // todo
	"uci" : {name: "Cal Irvine", football: false},
	"ucsb" : {name: "Cal Santa Barbara", football: false},
	"ucf" : {name: "Central Florida", football: true},
	"ucla" : {name: "UCLA", football: true},
	"uic" : {name: "UIC", football: false},
	"umassl" : {name: "UMass Lowell", football: false}, // todo
	"umbc" : {name: "UMBC", football: false}, //todo
	"umkc" : {name: "UMKC", football: false},//todo
	"unca" : {name: "UNC Asheville", football: false}, //todo
	"uncg" : {name: "UNC Greensboro", football: false}, // todo
	"uncw" : {name: "UNC Wilmington", football: false}, // todo
	"unlv" : {name: "UNLV", football: true},
	"usc" : {name: "USC", football: true},
	"utah" : {name: "Utah University", football: true},
	"utst" : {name: "Utah State", football: true},
	"utv" : {name: "Utah Valley", football: false},
	"utep" : {name: "UTEP", football: true},
	"utrgv" : {name: "UTRGV", football: false}, // todo
	"utsa" : {name: "UTSA", football: true},
	"van" : {name: "Vanderbilt", football: true},
	"ver" : {name: "Vermont", football: false},
	"vcu" : {name: "Virginia Commonwealth", football: false},
	"va" : {name: "Virginia", football: true},
	"vatech" : {name: "Virginia Tech", football: true},
	"wake" : {name: "Wake Forest", football: true},
	"was" : {name: "Washington University", football: true},
	"wasst" : {name: "Washington State", football: true},
	"wv" : {name: "West Virginia", football: true},
	"wky" : {name: "Western Kentucky", football: true},
	"wmi" : {name: "Western Michigan", football: true},
	"wic" : {name: "Wichita State", football: false}, // todo
	"win" : {name: "Winthrop", football: false},
	"wis" : {name: "Wisconsin", football: true},
	"wrs" : {name: "Wright State", football: false}, // todo
	"wy" : {name: "Wyoming", football: true},
	"xav" : {name: "Xavier", football: false}
};

var NHL_TEAMS = {
	"ana" : {name: "Anaheim Ducks"},
	"ari" : {name: "Arizona Coyotes"},
	"bos" : {name: "Boston Bruins"},
	"buf" : {name: "Buffalo Sabres"},
	"cal" : {name: "Calgary Flames"},
	"car" : {name: "Carolina Hurricanes"},
	"chi" : {name: "Chicago Blackhawks"},
	"colo" : {name: "Colorado Avalanche"},
	"colu" : {name: "Columbus Blue Jackets"},
	"dal" : {name: "Dallas Stars"},
	"det" : {name: "Detroit Red Wings"},
	"edm" : {name: "Edmonton Oilers"},
	"fla" : {name: "Florida Panthers"},
	"la" : {name: "Los Angeles Kings"},
	"min" : {name: "Minnesota Wild"},
	"mon" : {name: "Montreal Canadiens"},
	"nas" : {name: "Nashville Predators"},
	"nj" : {name: "New Jersey Devils"},
	"nyi" : {name: "New York Islanders"},
	"nyr" : {name: "New York Rangers"},
	"ott" : {name: "Ottawa Senators"},
	"phi" : {name: "Philadelphia Flyers"},
	"pit" : {name: "Pittsburgh Penguins"},
	"sj" : {name: "San Jose Sharks"},
	"stl" : {name: "St. Louis Blues"}, //todo
	"tb" : {name: "Tampa Bay Lightning"},
	"tor" : {name: "Toronto Maple Leafs"},
	"van" : {name: "Vancouver Canucks"},
	"veg" : {name: "Vegas Golden Knights"},
	"was" : {name: "Washington Capitals"},
	"win" : {name: "Winnipeg Jets"}
};

var leagueIds = {
	"NFL": "sport=football&subsport=NFL",
	"NBA": "sport=basketball&subsport=NBA",
	"CFB": "sport=football&subsport=NCAA",
	"CBB": "sport=basketball&subsport=NCAA",
	"ALL": "unused"
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
	"AMAZON.StopIntent": function() {
		this.emit(":tell", EXIT_SKILL_MESSAGE);
	},
	"AMAZON.CancelIntent": function() {
		this.emit(":tell", EXIT_SKILL_MESSAGE);
	},
	"AMAZON.HelpIntent": function() {
		this.emit(":ask", HELP_MESSAGE + getGenericHelpMessage(), getGenericHelpMessage());
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
	//console.log("request = "+JSON.stringify(this.event.request)); //uncomment if you want to see the request
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
			console.log("sports event:", sportsEvent);
		}
		var self = this;
		getAllLines(teamOne, teamTwo, sportsEvent, function(retVal, team, league) {
			console.log("searchByTeamNameIntentHandler returning with", retVal);
			var leagueId = leagueIds[league];
				parseString(retVal, function(err, lines) {
					console.log("got", lines);
					var found = false;
					if(!lines || !lines.bestlinesports_line_feed) {
						console.error("No spreads returned!");
						speech = getCouldntFindError(teamOne);
						found = true; // nothing to parse.
					}
					var result = {"teamOne" : team};
					var teamParsed = (team && team['team']) ? team['team']['name'] : null;
					var speech;
					for(var i = 0; i < lines.bestlinesports_line_feed.event.length && !found; i++) {
						var game = lines.bestlinesports_line_feed.event[i];
						var team1 = lines.bestlinesports_line_feed.event[i].participant[0];
						var team2 = lines.bestlinesports_line_feed.event[i].participant[1];	
						console.log("checking", team1, team2, league);	
						console.log("game", game);				
						if(team1.participant_name[0] === teamParsed) {
							var onTheRoad = (team1.visiting_home_draw[0] === "Visiting");
							var line;								
							if(onTheRoad) {
								line = result['line'] = game.period[0].spread[0].spread_visiting;
							} else {
								line = result['line'] = game.period[0].spread[0].spread_home;
							}
							console.log("team1 match, on the road?", onTheRoad);
							if(line === '') {
								speech = noSpread(teamParsed, team2.participant_name[0], league);
							} else {
								if(league === "ALL") {
									league = getLeagueName(game.league[0]);
								}
								speech = spreadToSpeech(line, teamParsed, team2.participant_name[0], onTheRoad, league);
							}
							result['teamTwo'] = team2.participant_name[0];
							result['teamOneML'] = team1.odds[0].moneyline;
							result['teamTwoML'] = team2.odds[0].moneyline;
							found = true; 
						}  else if(team2.participant_name[0] === teamParsed) {
							var onTheRoad = (team2.visiting_home_draw[0] === "Visiting");
							var line;								
							if(onTheRoad) {
								line = result['line'] = game.period[0].spread[0].spread_visiting;
							} else {
								if(league === "ALL") {
									league = getLeagueName(game.league[0]);
								}
								line = result['line'] = game.period[0].spread[0].spread_home;
							}
							console.log("team2 match, on the road?", onTheRoad);
							if(line === '') {
								speech = noSpread(teamParsed, team1.participant_name[0], league);
							} else {
								speech = spreadToSpeech(line, teamParsed, team1.participant_name[0], onTheRoad, league);
							}
							result['teamTwo'] = team1.participant_name[0];
							result['teamOneML'] = team2.odds[0].moneyline;
							result['teamTwoML'] = team1.odds[0].moneyline;
							found = true;
						}
						if(found) {
							result['ou'] = game.period[0].total[0].total_points;
							if(result['ou']) {
								speech += "The over under is " + result['ou'] + " points. ";
							}
							console.log("Result", result);
							break;
						}
					}
					if(!speech) {
						speech = getCouldntFindError(teamOne);
					}
					self.attributes.lastSearch = result;
					self.attributes.lastSearch.speech = speech;
					console.log("Going to return: " + speech);
					self.emit(":tell", speech);
				}); 
		}, function() {
			self.emit(":tell", getCouldntFindError(teamOne));
		});
	} else {
		console.log("Don't have team one to search!");
		this.emit(":ask", HELP_MESSAGE + getGenericHelpMessage());
	}
}


// =====================================================================================================
// ------------------------------- Section 3. Generating Speech Messages -------------------------------
// =====================================================================================================

function getGenericHelpMessage(){
	return "For example, you can ask for 'the steelers,' or 'the West Virginia basketball game.'";
}

function getLeagueName(leagueName) {
	console.log("getLeagueName", leagueName);
	if(leagueName === "NCAA Football") {
		return "CFB";
	} else if(leagueName === "NCAA Basketball") {
		return "CBB";
	} else if(leagueName === "NFL" || leagueName === "NBA") {
		return leagueName;
	} else {
		return null;
	}
}

function getCouldntFindError(teamName) {
	if(!teamName) {
		teamName = "that team.";
	} else if(!teamName.toLowerCase().substring(0, 4).includes("the")) {
		teamName = "the " + teamName;	
	}
	return "Sorry, I couldn't find odds for " + teamName + " game.";
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
	var queryStr = "";	
	if(leagueIds[league] !== leagueIds["ALL"]) {
		queryStr = leagueIds[league];
	}
	var options = {
		host : 'livelines.betonline.com',
		path : '/sys/LineXML/LiveLineObjXml.asp?' + queryStr, // if no query, site will default to today's events.
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
				Key:league
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
			var ncaa = getNCAATeamName(teamOne);
			if(ncaa) {
				// if this team has no football team we're obviously searching BB
				if(!ncaa.football || sportsEvent.includes("basketball")) {
					league = "CBB";
				} else if(sportsEvent.includes("football")) {
					league = "CFB";
				} else {
					league = "ALL";
				}
			}
		} else if(sportsEvent.includes("n. f. l.") || sportsEvent.includes("NFL") || sportsEvent.includes("NF L")) {
			teamObj = getNFLTeamName(teamOne);
			league = "NFL";
		} else if(sportsEvent.includes("n. b. a.") || sportsEvent.includes("NBA") || sportsEvent.includes("NB A")) {
			teamObj = getNBATeamName(teamOne);
			league = "NBA";
		} else if(sportsEvent.includes("football")) {
			// could be NFL or NCAA..
			teamObj = getNFLTeamName(teamOne);
			league = "NFL";
			if(!teamObj) {
				teamObj = getNCAATeamName(teamOne);
				league = "CFB";
			}
		} else if(sportsEvent.includes("basketball")) {
			// could be NBA or NCAA.
			teamObj = getNBATeamName(teamOne);
			league = "NBA";			
			if(!teamObj) {
				teamObj = getNCAATeamName(teamOne);
				league = "CBB";
			}	
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
			t1 = getNCAATeamName(teamOne);
			var t2 = getNCAATeamName(teamTwo);
			if(t1 && (t1.exactMatch || t2)) {
				teamObj = t1;
				if(!t1.football || !t2.football) {
					// one of these teams doesn't have a football team, so this must be a basketball matchup.
					league = "CBB";
				} else {
					league = "ALL";
				}
			}
		}
	} else {
		// we only have 1 team name to work with.
		teamObj = getNFLTeamName(teamOne);
		if(teamObj) {
			league = "NFL";
		} else {
			teamObj = getNBATeamName(teamOne);
			if(teamObj) {
				league = "NBA";
			} else {
				// try college last.
				teamObj = getNCAATeamName(teamOne);
				if(teamObj) {
					if(!teamObj.team.football) {
						// team doesn't have a football team. must be BB 
						console.log(teamOne + " is a basketball only school.");
						league = "CBB";
					} else {
						league = "ALL";
					}
				}
			}
		}	
	}
	if(!teamObj) {
		teamNotFoundCallback();
	} else {
		console.log("league", league, "teamObj", teamObj);
	}

	var params = {
		Bucket: S3_BUCKET_NAME,
		Key: league
	};	
	s3.getObject(params, function(err, data) {
		if(err) {
			console.log(err, err.stack);
			console.log("getting up to date line info");
			updateOdds(teamObj, league, successCallback);
		} else {
			var staleOdds = new Date(data.LastModified);
			staleOdds.setHours(staleOdds.getHours() + HOURS_TO_KEEP_ODDS);
			var timestamp = new Date();
			if(timestamp > staleOdds) {
				// odds are HOURS_TO_KEEP_ODDS hours old, update them.
				console.log("Odds were last updated: " + data.LastModified + ", greater than " + HOURS_TO_KEEP_ODDS + " hours old, updating.");
				updateOdds(teamObj, league, successCallback);
			} else {
				console.log("Odds were last updated: " + data.LastModified + ", no need to update since it is less than " + HOURS_TO_KEEP_ODDS + " hours old.");
				successCallback(data.Body.toString('ascii'), teamObj, league);
			}
		}
	});

}

function spreadToSpeech(spread, teamOne, teamTwo, teamOneOnTheRoad, league) {
	console.log("spreadToSpeech", spread);
	var where = teamOneOnTheRoad ? "on the road" : "at home";
	var singular = (league === "CFB" || league === "CBB");

	var speech;
	if(singular) {
		speech = teamOne + " is ";
	} else {
		speech = "The " + teamOne + " are ";
	}

	if(spread === '0') {
		speech += "at even odds against ";
	} else if(spread < 0) {
		speech += (spread * -1) + " point favorites against ";
	} else {
		speech += spread + " point underdogs against ";
	}

	if(!singular) {
		speech += "the ";
	}
	speech += teamTwo + " " + where + ". ";
	return speech;
}

function noSpread(teamOne, teamTwo, league) {
	var singular = (league === leagueIds["CFB"] || league === leagueIds["CBB"]);
	var speech = "We don't have odds for ";
	if(!singular) {
		speech += "the ";
	}
	speech += teamOne + " against ";
	if(!singular) {
		speech += "the ";
	}
	speech += teamTwo + " yet, please check again later. ";
	return speech;
}

function getNCAATeamName(input) {
	if(!input) {
		return null;
	}
	var i = input.toLowerCase();
	
	if(i.includes("air") && i.includes("force")) {
		return {team: NCAA_TEAMS["af"], exactMatch: true};
	} else if(i.includes("akron")) {
		return {team: NCAA_TEAMS["ak"], exactMatch: true};
	} else if(i.includes("alabama")) {
		if(i.includes("south")) {
			return {team: NCAA_TEAMS["sal"], exactMatch: true};
		}
		return {team: NCAA_TEAMS["al"], exactMatch: true};
	} else if(i.includes("american")) {
		return {team: NCAA_TEAMS["am"], exactMatch: true};
	} else if(i.includes("appalachian") || (i.includes("app") && i.includes("state"))) {
		return {team: NCAA_TEAMS["apst"], exactMatch: true};
	} else if(i.includes("arizona")) {
		if(i.includes("state")) {
			return {team: NCAA_TEAMS["azst"], exactMatch: true};
		} else {
			return {team: NCAA_TEAMS["az"], exactMatch: true};
		}
	} else if(i.includes("arkansas")) {
		if(i.includes("State")) {
			return {team: NCAA_TEAMS["arkst"], exactMatch: true};
		} else {
			return {team: NCAA_TEAMS["ark"], exactMatch: true};
		}
	} else if(i.includes("army")) {
		return {team: NCAA_TEAMS["army"], exactMatch: true};
	} else if(i.includes("auburn")) {
		return {team: NCAA_TEAMS["aub"], exactMatch: true};
	} else if(i.includes("ball state")) {
		return {team: NCAA_TEAMS["ballst"], exactMatch: true};
	} else if(i.includes("baylor")) {
		return {team: NCAA_TEAMS["bay"], exactMatch: true};
	} else if(i.includes("belmont")) {
		return {team: NCAA_TEAMS["bel"], exactMatch: true};
	} else if(i.includes("binghamton")) { // todo
		return {team: NCAA_TEAMS["bin"], exactMatch: true};
	} else if(i.includes("boise")) {
		return {team: NCAA_TEAMS["boi"], exactMatch: true};
	} else if(i.includes("boston")) {
		if(i.includes("college")) {
			return {team: NCAA_TEAMS["bc"], exactMatch: true};
		}
		return {team: NCAA_TEAMS["bos"], exactMatch: true};
	} else if(i.includes("bowling")) {
		return {team: NCAA_TEAMS["bg"], exactMatch: true};
	} else if(i.includes("bradley")) {
		return {team: NCAA_TEAMS["bra"], exactMatch: true};
	} else if(i.includes("buffalo")) {
		return {team: NCAA_TEAMS["buf"], exactMatch: false}; // NFL -> bills
	} else if(i.includes("byu") || i.includes("b. y. u.") || i.includes("brigham")) {
		return {team: NCAA_TEAMS["byu"], exactMatch: true};
	} else if(i.includes("cal")) {
		if(i.includes("state")) {
			if(i.includes("baker")) {
				return {team: NCAA_TEAMS["calbak"], exactMatch: true};
			} else if(i.includes("fuller")) {
				return {team: NCAA_TEAMS["calful"], exactMatch: true};
			} else if(i.includes("north")) {
				return {team: NCAA_TEAMS["calnor"], exactMatch: true};
			} else {
				console.log("Couldn't find cal state team", i);
				return null;
			}
		} else if(i.includes("irvine")) {
			return {team: NCAA_TEAMS["uci"], exactMatch: true};
		} else if(i.includes("barbara")) {
			return {team: NCAA_TEAMS["ucb"], exactMatch: true};
		}
		return {team: NCAA_TEAMS["cal"], exactMatch: true};
	} else if(i.includes("canisius")) {
		return {team: NCAA_TEAMS["can"], exactMatch: true};
	} else if(i.includes("central")) {
		return {team: NCAA_TEAMS["cmi"], exactMatch: true};
	} else if(i.includes("charleston")) {
		return {team: NCAA_TEAMS["ch"], exactMatch: true};
	} else if(i.includes("charlotte")) {
		return {team: NCAA_TEAMS["cha"], exactMatch: true};
	} else if(i.includes("chicago")) {
		return {team: NCAA_TEAMS["chist"], exactMatch: true};
	} else if(i.includes("cincinnati")) {
		return {team: NCAA_TEAMS["cin"], exactMatch: true};
	} else if(i.includes("clemson")) {
		return {team: NCAA_TEAMS["cle"], exactMatch: true};
	} else if(i.includes("cleveland")) {
		return {team: NCAA_TEAMS["clest"], exactMatch: true};
	} else if(i.includes("coast")) {
		return {team: NCAA_TEAMS["cc"], exactMatch: true};
	} else if(i.includes("colorado")) {
		if(i.includes("state")) {
			return {team: NCAA_TEAMS["colst"], exactMatch: true};
		} else {
			return {team: NCAA_TEAMS["co"], exactMatch: true};
		}
	} else if(i.includes("connecticut")) {
		return {team: NCAA_TEAMS["con"], exactMatch: true};
	} else if(i.includes("creighton")) {
		return {team: NCAA_TEAMS["cre"], exactMatch: true};
	} else if(i.includes("denver")) {
		return {team: NCAA_TEAMS["den"], exactMatch: true};
	} else if(i.includes("paul")) {
		return {team: NCAA_TEAMS["dep"], exactMatch: true};
	} else if(i.includes("detroit")) {
		return {team: NCAA_TEAMS["det"], exactMatch: true};
	} else if(i.includes("duke")) {
		return {team: NCAA_TEAMS["duke"], exactMatch: true};
	} else if(i.includes("drexel")) {
		return {team: NCAA_TEAMS["dre"], exactMatch: true};
	} else if(i.includes("east")) {
		if(i.includes("carolina")) {
			return {team: NCAA_TEAMS["ec"], exactMatch: true};
		} else if(i.includes("michigan")) {
			return {team: NCAA_TEAMS["em"], exactMatch: false};
		} else {
			console.log("Couldn't find team with 'east' in the string", i);
			return null;
		}
	} else if(i.includes("evansville")) {
		return {team: NCAA_TEAMS["ev"], exactMatch: true};
	} else if(i.includes("fair") && i.includes("field")) {
		return {team: NCAA_TEAMS["fai"], exactMatch: true};
	} else if(i.includes("fiu") || i.includes("f. i. u.") || (i.includes("florida") && i.includes("international"))) {
		return {team: NCAA_TEAMS["fiu"], exactMatch: true};
	} else if(i.includes("florida")) {
		if(i.includes("atlantic")) {
			return {team: NCAA_TEAMS["fla"], exactMatch: true};
		} else if(i.includes("state")) {
			return {team: NCAA_TEAMS["flst"], exactMatch: true};
		} else if(i.includes("miami")) {
			return {team: NCAA_TEAMS["miafl"], exactMatch: true};
		} else if(i.includes("south")) {
			return {team: NCAA_TEAMS["usf"], exactMatch: true};
		} else if(i.includes("central")) {
			return {team: NCAA_TEAMS["ucf"], exactMatch: true};
		} else if(i.includes("gulf") && i.includes("coast")) {
			return {team: NCAA_TEAMS["flgc"], exactMatch: true};
		} else if(i.includes("north")) {
			return {team: NCAA_TEAMS["nfl"], exactMatch: true};
		} else {
			console.log("Defaulting to regular ol' Florida", i);
			return {team: NCAA_TEAMS["fl"], exactMatch: false};
		}
	} else if(i.includes("fort") && i.includes("wayne")) {
		return {team: NCAA_TEAMS["fo"], exactMatch: true};
	} else if(i.includes("fresno")) {
		return {team: NCAA_TEAMS["fresno"], exactMatch: true};
	} else if(i.includes("george")) {
		if(i.includes("mason")) {
			return {team: NCAA_TEAMS["geom"], exactMatch: true};
		} else if(i.includes("washington")) {
			return {team: NCAA_TEAMS["geow"], exactMatch: true};
		} else {
			console.log("Couldn't find george team", i); // todo
			return null;
		}
	} else if(i.includes("georgia")) {
		if(i.includes("state")) {
			return {team: NCAA_TEAMS["gast"], exactMatch: true};
		} else if(i.includes("tech")) {
			return {team: NCAA_TEAMS["gatech"], exactMatch: true};
		} else {
			console.log("Defaulting to regular ol' Georgia", i);		
			return {team: NCAA_TEAMS["ga"], exactMatch: true};
		}
	} else if(i.includes("gonzaga")) {
		return {team: NCAA_TEAMS["gon"], exactMatch: true};
	} else if(i.includes("grand") && i.includes("canyon")) {
		return {team: NCAA_TEAMS["gra"], exactMatch: true};
	} else if(i.includes("green") && i.includes("bay")) {
		return {team: NCAA_TEAMS["gb"], exactMatch: true};
	} else if(i.includes("hawaii")) {
		return {team: NCAA_TEAMS["haw"], exactMatch: true};
	} else if(i.includes("high") && i.includes("point")) {
		return {team: NCAA_TEAMS["hp"], exactMatch: true};
	} else if(i.includes("hofstra")) {
		return {team: NCAA_TEAMS["hof"], exactMatch: true};
	} else if(i.includes("houston")) {
		return {team: NCAA_TEAMS["hou"], exactMatch: true};
	} else if(i.includes("idaho")) {
		return {team: NCAA_TEAMS["id"], exactMatch: true};
	} else if(i.includes("illinois")) {
		if(i.includes("north")) {
			return {team: NCAA_TEAMS["niu"], exactMatch: true};
		} else if(i.includes("chicago")) {
			return {team: NCAA_TEAMS["uci"], exactMatch: true};
		}
		return {team: NCAA_TEAMS["il"], exactMatch: true};
	} else if(i.includes("indiana")) {
		if(i.includes("purdue")) {
			return {team: NCAA_TEAMS["iupui"], exactMatch: true};
		}
		return {team: NCAA_TEAMS["ind"], exactMatch: true};
	} else if(i.includes("iona")) {
		return {team: NCAA_TEAMS["iona"], exactMatch: true};
	} else if(i.includes("iowa")) {
		if(i.includes("state")) {
			return {team: NCAA_TEAMS["iast"], exactMatch: true};
		}
		return {team: NCAA_TEAMS["ia"], exactMatch: true};
	} else if(i.includes("iupui")) {
		return {team: NCAA_TEAMS["iupui"], exactMatch: true};
	} else if(i.includes("kansas")) {
		if(i.includes("state")) {
			return {team: NCAA_TEAMS["kst"], exactMatch: true};
		}
		return {team: NCAA_TEAMS["kan"], exactMatch: true};
	} else if(i.includes("kentucky")) { // do before 'kent st'
		if(i.includes("west")) {
			return {team: NCAA_TEAMS["wky"], exactMatch: true};
		} else if(i.includes("north")) {
			return {team: NCAA_TEAMS["nky"], exactMatch: true};
		}
		return {team: NCAA_TEAMS["kent"], exactMatch: true};
	} else if(i.includes("kent")) {
		return {team: NCAA_TEAMS["kentst"], exactMatch: true};
	} else if(i.includes("salle")) {
		return {team: NCAA_TEAMS["las"], exactMatch: true};
	} else if(i.includes("lipscomb")) {
		return {team: NCAA_TEAMS["lip"], exactMatch: true};
	} else if(i.includes("little") && i.includes("rock")) {
		return {team: NCAA_TEAMS["lit"], exactMatch: true};
	} else if(i.includes("liu") || i.includes("l. i. u.")) {
		return {team: NCAA_TEAMS["liu"], exactMatch: true};
	} else if(i.includes("long")) {
		if(i.includes("beach")) {
			return {team: NCAA_TEAMS["lb"], exactMatch: true};
		} else if(i.includes("wood")) {
			return {team: NCAA_TEAMS["lon"], exactMatch: true};
		} else {
			console.log("Couldn't find long team", i);
			return null;
		}
	} else if(i.includes("lsu") || i.includes("l. s. u.")) {
		return {team: NCAA_TEAMS["lsu"], exactMatch: true};
	} else if(i.includes("louisiana")) {
		if(i.includes("state")) {
			return {team: NCAA_TEAMS["lsu"], exactMatch: true};
		} else if(i.includes("tech")) {
			return {team: NCAA_TEAMS["latech"], exactMatch: true};
		} else if(i.includes("fayette")) {
			return {team: NCAA_TEAMS["lala"], exactMatch: true};
		} else if(i.includes("monroe")) {
			return {team: NCAA_TEAMS["lamo"], exactMatch: true};
		} else {
			console.log("Couldn't find louisiana team", i);
			return null;
		}
	} else if(i.includes("louisville")) {
		return {team: NCAA_TEAMS["lou"], exactMatch: true};
	} else if(i.includes("loyola")) {
		if(i.includes("chicago")) {
			return {team: NCAA_TEAMS["loyc"], exactMatch: true};
		} else if(i.includes("maryland") || i.includes("md")) {
			return {team: NCAA_TEAMS["loymd"], exactMatch: true};
		} else if(i.includes("mount")) {
			return {team: NCAA_TEAMS["loym"], exactMatch: true};
		} else {
			console.log("Couldn't find loyola team", i);
			return null; // TODO tell user to be more specific!
		}
	} else if(i.includes("manhattan")) {
		return {team: NCAA_TEAMS["man"], exactMatch: true};
	} else if(i.includes("marshall")) {
		return {team: NCAA_TEAMS["mars"], exactMatch: true};
	} else if(i.includes("marquette")) {
		return {team: NCAA_TEAMS["marq"], exactMatch: true};
	} else if(i.includes("maryland")) {
		if(i.includes("east") || i.includes("shore")) {
			return {team: NCAA_TEAMS["mdes"], exactMatch: true};
		}
		return {team: NCAA_TEAMS["md"], exactMatch: true};
	} else if(i.includes("mass")) {
		if(i.includes("low")) {
			return {team: NCAA_TEAMS["umassl"], exactMatch: true};
		}
		return {team: NCAA_TEAMS["mass"], exactMatch: true};
	} else if(i.includes("memphis")) {
		return {team: NCAA_TEAMS["mem"], exactMatch: true};
	} else if(i.includes("michigan")) {
		if(i.includes("state")) {
			return {team: NCAA_TEAMS["mist"], exactMatch: true};
		} else if(i.includes("west")) {
			return {team: NCAA_TEAMS["wmi"], exactMatch: true};
		}
		return {team: NCAA_TEAMS["mi"], exactMatch: true};
	} else if(i.includes("middle")) {
		return {team: NCAA_TEAMS["midtenn"], exactMatch: true};
	} else if(i.includes("milwaukee")) {
		return {team: NCAA_TEAMS["mil"], exactMatch: true};
	} else if(i.includes("minnesota")) {
		return {team: NCAA_TEAMS["minn"], exactMatch: true};
	} else if(i.includes("miss") && (i.includes("ole") || i.includes("old"))) {
		return {team: NCAA_TEAMS["ms"], exactMatch: true};
	} else if(i.includes("mississippi")) {
		if(i.includes("state")) {
			return {team: NCAA_TEAMS["msst"], exactMatch: true};
		}
		return {team: NCAA_TEAMS["ms"], exactMatch: true};
	} else if(i.includes("missouri")) {
		if(i.includes("kansas")) {
			return {team: NCAA_TEAMS["umkc"], exactMatch: true};
		}
		return {team: NCAA_TEAMS["mo"], exactMatch: true};
	} else if(i.includes("mount")) {
		if(i.includes("mary")) {
			return {team: NCAA_TEAMS["loym"], exactMatch: true};
		} else if(i.includes("saint") || i.includes("mary")) {
			return {team: NCAA_TEAMS["msm"], exactMatch: true};
		} else {
			console.log("Couldn't find mount team", i);
			return null; // todo
		}
	} else if(i.includes("navy")) {
		return {team: NCAA_TEAMS["navy"], exactMatch: true};
	} else if(i.includes("nebraska")) {
		return {team: NCAA_TEAMS["neb"], exactMatch: true};
	} else if(i.includes("nevada")) {
		return {team: NCAA_TEAMS["nev"], exactMatch: true};
	} else if(i.includes("mexico")) {
		if(i.includes("state")) {
			return {team: NCAA_TEAMS["nmst"], exactMatch: true};
		}
		return {team: NCAA_TEAMS["nm"], exactMatch: true};
	} else if(i.includes("niagara")) {
		return {team: NCAA_TEAMS["nia"], exactMatch: true};
	} else if(i.includes("njit") || i.includes("n. j. i. t.") || (i.includes("new") && i.includes("jersey"))) {
		return {team: NCAA_TEAMS["njit"], exactMatch: true};
	} else if(i.includes("carolina")) {
		if(i.includes("east")) {
			return {team: NCAA_TEAMS["ec"], exactMatch: true};
		} else if(i.includes("state")) {
			return {team: NCAA_TEAMS["ncst"], exactMatch: true};
		} else if(i.includes("north")) {
			return {team: NCAA_TEAMS["nc"], exactMatch: true};
		} else if(i.includes("south")) {
			if(i.includes("state")) {
				return {team: NCAA_TEAMS["scu"], exactMatch: true};
			}
			return {team: NCAA_TEAMS["sc"], exactMatch: true};
		} else {
			console.log("Couldn't find carolina team", i);
			return null;
		}
	} else if((i.includes("nc") || i.includes("n. c.")) && i.includes("state")) {
		return {team: NCAA_TEAMS["ncst"], exactMatch: true};
	} else if(i.includes("niu") || i.includes("n. i. u.")) {
		return {team: NCAA_TEAMS["niu"], exactMatch: true};
	} else if(i.includes("north") && i.includes("east")) {
		return {team: NCAA_TEAMS["ne"], exactMatch: true};
	} else if(i.includes("north") && i.includes("west")) {
		return {team: NCAA_TEAMS["nw"], exactMatch: true};
	} else if(i.includes("notre") || i.includes("dame")) {
		return {team: NCAA_TEAMS["nd"], exactMatch: true};
	} else if(i.includes("ohio")) {
		if(i.includes("state")) {
			return {team: NCAA_TEAMS["ohst"], exactMatch: true};
		} else if(i.includes("miami")) {
			return {team: NCAA_TEAMS["miaoh"], exactMatch: true};
		}
		return {team: NCAA_TEAMS["oh"], exactMatch: true};
	} else if(i.includes("oklahoma")) {
		if(i.includes("state")) {
			return {team: NCAA_TEAMS["okst"], exactMatch: true};
		}
		return {team: NCAA_TEAMS["ok"], exactMatch: false};
	} else if(i.includes("oak") && i.includes("land")) {
		return {team: NCAA_TEAMS["oak"], exactMatch: true};
	} else if(i.includes("oak") && i.includes("state")) {
		return {team: NCAA_TEAMS["okst"], exactMatch: true};
	} else if(i.includes("dominion")) {
		return {team: NCAA_TEAMS["od"], exactMatch: true};
	} else if(i.includes("omaha")) {
		return {team: NCAA_TEAMS["oma"], exactMatch: true};
	} else if(i.includes("oral")) {
		return {team: NCAA_TEAMS["ora"], exactMatch: true};
	} else if(i.includes("oregon")) {
		if(i.includes("state")) {
			return {team: NCAA_TEAMS["orst"], exactMatch: true};
		}
		return {team: NCAA_TEAMS["or"], exactMatch: true};
	} else if(i.includes("pacific")) {
		return {team: NCAA_TEAMS["pac"], exactMatch: true};
	} else if(i.includes("penn")) {
		return {team: NCAA_TEAMS["ps"], exactMatch: true};
	} else if(i.includes("pepper")) {
		return {team: NCAA_TEAMS["pep"], exactMatch: true};
	} else if(i.includes("pitt")) {
		return {team: NCAA_TEAMS["pitt"], exactMatch: true};
	} else if(i.includes("portland")) {
		return {team: NCAA_TEAMS["por"], exactMatch: true};
	} else if(i.includes("providence")) {
		return {team: NCAA_TEAMS["pro"], exactMatch: true};
	} else if(i.includes("purdue")) {
		return {team: NCAA_TEAMS["pur"], exactMatch: true};
	} else if(i.includes("quinn")) {
		return {team: NCAA_TEAMS["qui"], exactMatch: true};
	} else if(i.includes("radford")) {
		return {team: NCAA_TEAMS["rad"], exactMatch: true};
	} else if(i.includes("rice")) {
		return {team: NCAA_TEAMS["rice"], exactMatch: true};
	} else if(i.includes("rider")) {
		return {team: NCAA_TEAMS["rid"], exactMatch: true};
	} else if(i.includes("rutgers")) {
		return {team: NCAA_TEAMS["rut"], exactMatch: true};
	} else if(i.includes("diego")) {
		return {team: NCAA_TEAMS["sdst"], exactMatch: true};
	} else if(i.includes("jose")) { // todo test
		return {team: NCAA_TEAMS["sjst"], exactMatch: true};
	} else if(i.includes("smu") || i.includes("s. m. u.") || i.includes("methodist")) {
		return {team: NCAA_TEAMS["smu"], exactMatch: true};
	} else if(i.includes("miss") && i.includes("south")) {
		return {team: NCAA_TEAMS["smi"], exactMatch: true};
	} else if(i.includes("saint")) {
		if(i.includes("bon") || i.includes("adventure") || i.includes("bonaventure")) {
			return {team: NCAA_TEAMS["stb"], exactMatch: true};
		} else if(i.includes("francisco")) {
			return {team: NCAA_TEAMS["sanf"], exactMatch: false};
		} else if(i.includes("john") || i.includes("jon")) {
			return {team: NCAA_TEAMS["stj"], exactMatch: true};
		} else if(i.includes("joseph") || i.includes("joe")) {
			return {team: NCAA_TEAMS["stjoe"], exactMatch: true};
		} else if(i.includes("louis")) {
			return {team: NCAA_TEAMS["stl"], exactMatch: true};
		} else if(i.includes("mary")) {
			return {team: NCAA_TEAMS["stm"], exactMatch: true};
		} else if(i.includes("francis") || i.includes("brooklyn")) {
			return {team: NCAA_TEAMS["stf"], exactMatch: true};
		} else if(i.includes("clara")) {
			return {team: NCAA_TEAMS["sant"], exactMatch: false};
		} else {
			console.log("Couldn't find saint team", i);
			return null; // todo
		}
	} else if(i.includes("francisco")) {
		return {team: NCAA_TEAMS["sanf"], exactMatch: true};
	} else if(i.includes("clara")) {
		return {team: NCAA_TEAMS["sant"], exactMatch: true};
	} else if(i.includes("seattle")) {
		return {team: NCAA_TEAMS["sea"], exactMatch: true};
	} else if(i.includes("seton") || i.includes("seedin")) {
		return {team: NCAA_TEAMS["set"], exactMatch: true};
	} else if(i.includes("siena")) {
		return {team: NCAA_TEAMS["sie"], exactMatch: true};
	} else if(i.includes("siu") || i.includes("edwards")) {
		return {team: NCAA_TEAMS["siu"], exactMatch: true};
	} else if(i.includes("stanford")) {
		return {team: NCAA_TEAMS["sta"], exactMatch: true};
	} else if(i.includes("syracuse")) {
		return {team: NCAA_TEAMS["syr"], exactMatch: true};
	} else if(i.includes("tcu") || i.includes("t. c. u.")) {
		return {team: NCAA_TEAMS["tcu"], exactMatch: true};
	} else if(i.includes("temple")) {
		return {team: NCAA_TEAMS["tem"], exactMatch: true};
	} else if(i.includes("texas")) { 
		if(i.includes("a and m")) { // todo test
			if(i.includes("corp") || i.includes("christ")) {
				return {team: NCAA_TEAMS["texamcc"], exactMatch: true};
			}
			return {team: NCAA_TEAMS["texam"], exactMatch: true};
		} else if(i.includes("state")) {
			return {team: NCAA_TEAMS["texst"], exactMatch: true};
		} else if(i.includes("tech")) {
			return {team: NCAA_TEAMS["textc"], exactMatch: true};
		} else if(i.includes("north")) {
			return {team: NCAA_TEAMS["nt"], exactMatch: true};
		} else if(i.includes("arlington")) {
			return {team: NCAA_TEAMS["texar"], exactMatch: true};
		} else if(i.includes("rio") || i.includes("rgv")) {
			return {team: NCAA_TEAMS["utrgv"], exactMatch: true};
		} else {
			console.log("defaulting to regular ol' texas", i);
			return {team: NCAA_TEAMS["tex"], exactMatch: true};
		}
	} else if(i.includes("toledo")) {
		return {team: NCAA_TEAMS["tol"], exactMatch: true};
	} else if(i.includes("troy")) {
		return {team: NCAA_TEAMS["troy"], exactMatch: true};
	} else if(i.includes("tulane")) {
		return {team: NCAA_TEAMS["tula"], exactMatch: true};
	} else if(i.includes("tulsa")) {
		return {team: NCAA_TEAMS["tuls"], exactMatch: true};
	} else if(i.includes("uab") || i.includes("u. a. b.") || i.includes("birmingham")) {
		return {team: NCAA_TEAMS["uab"], exactMatch: true};
	} else if(i.includes("riverside")) {
		return {team: NCAA_TEAMS["ucr"], exactMatch: true};
	} else if(i.includes("irvine")) {
		return {team: NCAA_TEAMS["uci"], exactMatch: true};
	} else if(i.includes("barbara")) {
		return {team: NCAA_TEAMS["ucb"], exactMatch: true};
	} else if(i.includes("asheville")) {
		return {team: NCAA_TEAMS["unca"], exactMatch: true};
	} else if(i.includes("greens")) {
		return {team: NCAA_TEAMS["uncg"], exactMatch: true};
	} else if(i.includes("wilmington")) {
		return {team: NCAA_TEAMS["uncw"], exactMatch: true};
	} else if(i.includes("ucf") || i.includes("u. c. f.")) {
		return {team: NCAA_TEAMS["ucf"], exactMatch: true};
	} else if(i.includes("ucla") || i.includes("u. c. l. a.") || i.includes("angeles")) {
		return {team: NCAA_TEAMS["ucla"], exactMatch: true};
	} else if(i.includes("uic")) {
		return {team: NCAA_TEAMS["uic"], exactMatch: true};
	} else if(i.includes("umbc") || (i.includes("baltimore") && i.includes("maryland"))) {
		return {team: NCAA_TEAMS["umbc"], exactMatch: true};
	} else if(i.includes("umkc")) {
		return {team: NCAA_TEAMS["umkc"], exactMatch: true};
	} else if(i.includes("unlv") || i.includes("u. n. l. v.") || i.includes("vegas")) {
		return {team: NCAA_TEAMS["unlv"], exactMatch: true};
	} else if(i.includes("usc") || i.includes("u. s. c.") || (i.includes("south") && i.includes("california"))) {
		return {team: NCAA_TEAMS["usc"], exactMatch: true};
	} else if(i.includes("utah")) {
		if(i.includes("state")) {
			return {team: NCAA_TEAMS["utst"], exactMatch: true};
		} else if(i.includes("valley")) {
			return {team: NCAA_TEAMS["utv"], exactMatch: true};
		}
		return {team: NCAA_TEAMS["utah"], exactMatch: true};
	} else if(i.includes("utep") || i.includes("u. t. e. p.") || i.includes("paso")) {
		return {team: NCAA_TEAMS["utep"], exactMatch: true};
	} else if(i.includes("utrgv") || i.includes("u. t. r. g. v.")) {
		return {team: NCAA_TEAMS["utrgv"], exactMatch: true};
	} else if(i.includes("utsa") || i.includes("u. t. s. a.") || i.includes("antonio")) {
		return {team: NCAA_TEAMS[""], exactMatch: true};
	} else if(i.includes("vanderbilt")) {
		return {team: NCAA_TEAMS["van"], exactMatch: true};
	} else if(i.includes("vcu") || i.includes("v. c. u.")) {
		return {team: NCAA_TEAMS["vcu"], exactMatch: true};
	} else if(i.includes("vermont")) {
		return {team: NCAA_TEAMS["ver"], exactMatch: true};
	} else if(i.includes("virginia")) {
		if(i.includes("west")) {
			return {team: NCAA_TEAMS["wv"], exactMatch: true};
		} else if(i.includes("tech")) {
			return {team: NCAA_TEAMS["vatech"], exactMatch: true};
		} else if(i.includes("common") || i.includes("wealth")) {
			return {team: NCAA_TEAMS["vcu"], exactMatch: true};
		}
		return {team: NCAA_TEAMS["va"], exactMatch: true};
	} else if(i.includes("wvu")) {
		return {team: NCAA_TEAMS["wv"], exactMatch: true};
	} else if(i.includes("wake") || i.includes("forest")) {
		return {team: NCAA_TEAMS["wake"], exactMatch: true};
	} else if(i.includes("washington")) {
		if(i.includes("state")) {
			return {team: NCAA_TEAMS["wasst"], exactMatch: true};
		}
		return {team: NCAA_TEAMS["was"], exactMatch: true};
	} else if(i.includes("wichita")) {
		return {team: NCAA_TEAMS["wic"], exactMatch: true};
	} else if(i.includes("winthrop")) {
		return {team: NCAA_TEAMS["win"], exactMatch: true};
	} else if(i.includes("wisconsin")) {
		return {team: NCAA_TEAMS["wis"], exactMatch: true};
	} else if(i.includes("state") && i.includes("right")) {
		return {team: NCAA_TEAMS["wrs"], exactMatch: true};
	} else if(i.includes("wyoming")) {
		return {team: NCAA_TEAMS["wy"], exactMatch: true};
	} else if(i.includes("xavier")) {
		return {team: NCAA_TEAMS["xav"], exactMatch: true};
	} else {
		return null;
	}
}

function getNBATeamName(input) {
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
	} else if(i.includes("wizard")) {
		return {team: NBA_TEAMS["was"], exactMatch: true};
	} else if(i.includes("washington") || i.includes("dc")) {
		return {team: NBA_TEAMS["was"], exactMatch: false};
	} else if(i.includes("angeles")) {
		return {team: NBA_TEAMS["lal"], exactMatch: false}; // sorry clippers
	} else {
		return null;
	}
}

function getNFLTeamName(input) {
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
		return {team: NFL_TEAMS["gb"], exactMatch: true};
	} else if(i.includes("texans")) {
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



function getNHLTeamName(input) {
	if(!input) {
		return null;
	}
	var i = input.toLowerCase();

	if(i.includes("duck")) {
		return {team: NHL_TEAMS["ana"], exactMatch: true};
	} else if(i.includes("coyote")) {
		return {team: NHL_TEAMS["ari"], exactMatch: true};
	} else if(i.includes("bruin")) {
		return {team: NHL_TEAMS["bos"], exactMatch: true};
	} else if(i.includes("sabre")) {
		return {team: NHL_TEAMS["buf"], exactMatch: true};
	} else if(i.includes("flame")) {
		return {team: NHL_TEAMS["cal"], exactMatch: true};
	} else if(i.includes("hurricane")) {
		return {team: NHL_TEAMS["car"], exactMatch: true};
	} else if(i.includes("black") && i.includes("hawk")) {
		return {team: NHL_TEAMS["chi"], exactMatch: true};
	} else if(i.includes("avalanche")) {
		return {team: NHL_TEAMS["colo"], exactMatch: true};
	} else if(i.includes("blue") && i.includes("jacket")) {
		return {team: NHL_TEAMS["colu"], exactMatch: true};
	} else if(i.includes("star")) {
		return {team: NHL_TEAMS["dal"], exactMatch: true};
	} else if(i.includes("red") && i.includes("wing")) {
		return {team: NHL_TEAMS["det"], exactMatch: true};
	} else if(i.includes("oiler")) {
		return {team: NHL_TEAMS["edm"], exactMatch: true};
	} else if(i.includes("panther")) {
		return {team: NHL_TEAMS["fla"], exactMatch: true};
	} else if(i.includes("king")) {
		return {team: NHL_TEAMS["la"], exactMatch: true};
	} else if(i.includes("wild")) {
		return {team: NHL_TEAMS["min"], exactMatch: true};
	} else if(i.includes("canadien")) {
		return {team: NHL_TEAMS["mon"], exactMatch: true};
	} else if(i.includes("predator")) {
		return {team: NHL_TEAMS["nas"], exactMatch: true};
	} else if(i.includes("devil")) {
		return {team: NHL_TEAMS["nj"], exactMatch: true};
	} else if(i.includes("island")) {
		return {team: NHL_TEAMS["nyi"], exactMatch: true};
	} else if(i.includes("ranger")) {
		return {team: NHL_TEAMS["nyr"], exactMatch: true};
	} else if(i.includes("senator")) {
		return {team: NHL_TEAMS["ott"], exactMatch: true};
	} else if(i.includes("flyer")) {
		return {team: NHL_TEAMS["phi"], exactMatch: true};
	} else if(i.includes("penguin")) {
		return {team: NHL_TEAMS["pit"], exactMatch: true};
	} else if(i.includes("shark")) {
		return {team: NHL_TEAMS["sj"], exactMatch: true};
	} else if(i.includes("blue")) {
		return {team: NHL_TEAMS["stl"], exactMatch: true};
	} else if(i.includes("lightning")) {
		return {team: NHL_TEAMS["tb"], exactMatch: true};
	} else if(i.includes("leaf") || i.includes("leaves")) {
		return {team: NHL_TEAMS["tor"], exactMatch: true};
	} else if(i.includes("canuck")) {
		return {team: NHL_TEAMS["van"], exactMatch: true};
	} else if(i.includes("knight")) {
		return {team: NHL_TEAMS["veg"], exactMatch: true};
	} else if(i.includes("capital")) {
		return {team: NHL_TEAMS["was"], exactMatch: true};
	} else if(i.includes("jet")) {
		return {team: NHL_TEAMS["win"], exactMatch: true};
	} else if(i.includes("anaheim")) {
		return {team: NHL_TEAMS["ana"], exactMatch: true};
	} else if(i.includes("arizona")) {
		return {team: NHL_TEAMS["ari"], exactMatch: false};
	} else if(i.includes("boston")) {
		return {team: NHL_TEAMS["bos"], exactMatch: false};
	} else if(i.includes("buffalo")) {
		return {team: NHL_TEAMS["buf"], exactMatch: true};
	} else if(i.includes("calgary")) {
		return {team: NHL_TEAMS["cal"], exactMatch: true};
	} else if(i.includes("carolina")) {
		return {team: NHL_TEAMS["car"], exactMatch: false};
	} else if(i.includes("chicago") && i.includes("hawk")) {
		return {team: NHL_TEAMS["chi"], exactMatch: false};
	} else if(i.includes("colorado")) { // todo unique?
		return {team: NHL_TEAMS["colo"], exactMatch: true};
	} else if(i.includes("columbus") && i.includes("jacket")) {
		return {team: NHL_TEAMS["colu"], exactMatch: true};
	} else if(i.includes("dallas")) {
		return {team: NHL_TEAMS["dal"], exactMatch: false};
	} else if(i.includes("detroit") && i.includes("wing")) {
		return {team: NHL_TEAMS["det"], exactMatch: false};
	} else if(i.includes("edmonton")) {
		return {team: NHL_TEAMS["edm"], exactMatch: true};
	} else if(i.includes("florida")) {
		return {team: NHL_TEAMS["fla"], exactMatch: false};
	} else if(i.includes("angeles") || i.includes("L. A.")) {
		return {team: NHL_TEAMS["la"], exactMatch: false};
	} else if(i.includes("minnesota")) {
		return {team: NHL_TEAMS["min"], exactMatch: false};
	} else if(i.includes("montreal")) {
		return {team: NHL_TEAMS["mon"], exactMatch: true};
	} else if(i.includes("nashville")) {
		return {team: NHL_TEAMS["nas"], exactMatch: true};
	} else if(i.includes("jersey")) {
		return {team: NHL_TEAMS["nj"], exactMatch: true};
	} else if(i.includes("york")) { // sorry islanders
		return {team: NHL_TEAMS["nyr"], exactMatch: false};
	} else if(i.includes("ottawa")) {
		return {team: NHL_TEAMS["ott"], exactMatch: true};
	} else if(i.includes("philadelphia") || i.includes("philly")) {
		return {team: NHL_TEAMS["phi"], exactMatch: false};
	} else if(i.includes("pitt")) {
		return {team: NHL_TEAMS["pit"], exactMatch: false};
	} else if(i.includes("jose")) {
		return {team: NHL_TEAMS["sj"], exactMatch: true};
	} else if(i.includes("louis")) {
		return {team: NHL_TEAMS["stl"], exactMatch: false};
	} else if(i.includes("tampa")) {
		return {team: NHL_TEAMS["tb"], exactMatch: false};
	} else if(i.includes("toronto") || i.includes("leaves")) {
		return {team: NHL_TEAMS["tor"], exactMatch: false};
	} else if(i.includes("vancouver")) {
		return {team: NHL_TEAMS["van"], exactMatch: true};
	} else if(i.includes("vegas")) {
		return {team: NHL_TEAMS["veg"], exactMatch: false};
	} else if(i.includes("washington") || i.includes("dc")) {
		return {team: NHL_TEAMS["was"], exactMatch: false};
	} else if(i.includes("winnipeg")) {
		return {team: NHL_TEAMS["win"], exactMatch: true};
	} else {
		return null;
	}
}
