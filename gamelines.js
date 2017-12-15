"use strict";
const Alexa = require("alexa-sdk"); // import the library
var http = require('http');
var parseString = require('xml2js').parseString;
var util = require('util');
var AWS = require('aws-sdk');
var s3 = new AWS.S3({apiVersion: '2006-03-01'});

var APP_ID = "amzn1.ask.skill.b012474e-0a43-4bf7-95a5-ca1496fe65fd";

var DEBUG = true;

var S3_BUCKET_NAME = "gamelines";
var HOURS_TO_KEEP_ODDS = 3;
var skillName = "Game Lines";

//This is the welcome message for when a user starts the skill without a specific intent.
var WELCOME_MESSAGE = "Welcome to " + skillName + ", find the line for an upcoming sport event. " + getGenericHelpMessage();

//This is the message a user will hear when they ask Alexa for help in your skill.
var HELP_MESSAGE = "I can help you find spreads for NFL, NBA and college games. ";

//This is the message a user will hear when they begin a new search
var NEW_SEARCH_MESSAGE = getGenericHelpMessage();

//This is the message a user will hear when they ask Alexa for help while in the SEARCH state
var SEARCH_STATE_HELP_MESSAGE = getGenericHelpMessage();

// This is the message use when the decides to end the search
var SHUTDOWN_MESSAGE = "Ok.";

//This is the message a user will hear when they try to cancel or stop the skill.
var EXIT_SKILL_MESSAGE = "Ok.";

var NFL_TEAMS = {
	"az": {name: "Arizona Cardinals"},
	"atl": {name: "Atlanta Falcons"},
	"bal": {name: "Baltimore Ravens"},
	"buf": {name: "Buffalo Bills"},
	"car": {name: "Carolina Panthers"},
	"chi": {name: "Chicago Bears"},
	"cin": {name: "Cincinnati Bengals"},
	"cle": {name: "Cleveland Browns"},
	"dal": {name: "Dallas Cowboys"},
	"den": {name: "Denver Broncos"},
	"det": {name: "Detroit Lions"},
	"gb": {name: "Green Bay Packers"},
	"hou": {name: "Houston Texans"},
	"ind": {name: "Indianapolis Colts"},
	"jax": {name: "Jacksonville Jaguars"},
	"kc": {name: "Kansas City Chiefs"},
	"lac": {name: "Los Angeles Chargers"},
	"lar": {name: "Los Angeles Rams"},
	"mia": {name: "Miami Dolphins"},
	"min": {name: "Minnesota Vikings"},
	"ne": {name: "New England Patriots"},
	"no": {name: "New Orleans Saints"},
	"nyg": {name: "New York Giants"},
	"nyj": {name: "New York Jets"},
	"oak": {name: "Oakland Raiders"},
	"phi": {name: "Philadelphia Eagles"},
	"pit": {name: "Pittsburgh Steelers"},
	"sf": {name: "San Francisco 49ers"},
	"sea": {name: "Seattle Seahawks"},
	"tb": {name: "Tampa Bay Buccaneers"},
	"ten": {name: "Tennessee Titans"},
	"was": {name: "Washington Redskins"}
};

var NBA_TEAMS = {
	"atl": {name: "Atlanta Hawks"},
	"bos": {name: "Boston Celtics"},
	"bro": {name: "Brooklyn Nets"},
	"cha": {name: "Charlotte Hornets"},
	"chi": {name: "Chicago Bulls"},
	"cle": {name: "Cleveland Cavaliers"},
	"dal": {name: "Dallas Mavericks"},
	"den": {name: "Denver Nuggets"},
	"det": {name: "Detroit Pistons"},
	"gs": {name: "Golden State Warriors"},	
	"hou": {name: "Houston Rockets"},
	"ind": {name: "Indiana Pacers"},
	"lac": {name: "Los Angeles Clippers"},
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
// https://en.wikipedia.org/wiki/List_of_NCAA_Division_I_men%27s_basketball_programs start with A-10
var NCAA_TEAMS = {
	"ab" : {name: "Abilene Christian", football: false},
	"af" : {name: "Air Force", football: true},
	"ak" : {name: "Akron", football: true},
	"al" : {name: "Alabama", football: true},
	"alam" : {name: "Alabama A&M", football: false},
	"alb" : {name: "Albany", football: false},
	"alco" : {name: "Alcorn State", football: false},
	"am" : {name: "American", football: false},
	"apst" : {name: "Appalachian State", football: true},
	"az" : {name: "Arizona", football: true},
	"azst" : {name: "Arizona State", football: true},
	"ark" : {name: "Arkansas", football: true},
	"arkpb" : {name: "Arkansas-Pine Bluff", football: false},
	"arkst" : {name: "Arkansas State", football: true},
	"army" : {name: "Army", football: true},
	"aub" : {name: "Auburn", football: true},
	"ausp" : {name: "Austin Peay", football: false},
	"ballst" : {name: "Ball State", football: true},
	"bay" : {name: "Baylor", football: true},
	"bel" : {name: "Belmont", football: false},
	"beth" : {name: "Bethune-Cookman", football: false},
	"bin" : {name: "Binghamton", football: false},
	"boi" : {name: "Boise State", football: true},
	"bc" : {name: "Boston College", football: true},
	"bos" : {name: "Boston", football: false},
	"bg" : {name: "Bowling Green", football: true},
	"bra" : {name: "Bradley", football: false},
	"bro" : {name: "Brown", football: false},
	"bry" : {name: "Bryant", football: false},
	"buck" : {name: "Bucknell", football: false},
	"buf" : {name: "Buffalo", football: true},
	"but" : {name: "Butler", football: false},
	"byu" : {name: "BYU", football: true},
	"calpoly" : {name: "Cal Poly", football: false},
	"cal" : {name: "California", football: true},
	"calbak" : {name: "Cal State Bakersfield", football: false}, // todo
	"calful" : {name: "Cal State Fullerton", football: false}, // todo
	"calnor" : {name: "CS Northridge", football: false},
	"camp" : {name: "Campbell", football: false},
	"can" : {name: "Canisius", football: false},
	"cena" : {name: "Central Arkansas", football: false},
	"cenc" : {name: "Central Connecticut", football: false},
	"cenm" : {name: "Central Michigan", football: true},
	"cha" : {name: "Charlotte", football: true},
	"ch" : {name: "Charleston", football: false},
	"chso" : {name: "Charleston Southern", football: false},
	"chat" : {name: "Chattanooga", football: false},
	"chist" : {name: "Chicago State", football: false},
	"cin" : {name: "Cincinnati", football: true},
	"cit" : {name: "Citadel", football: false},
	"cle" : {name: "Clemson", football: true},
	"clest" : {name: "Cleveland State", football: false},
	"cmi" : {name: "Central Michigan", football: true},
	"colg" : {name: "Colgate", football: false},
	"cc" : {name: "Coastal Carolina", football: true},
	"col" : {name: "Colorado", football: true},
	"colst" : {name: "Colorado State", football: true},
	"colu" : {name: "Columbia", football: false},
	"con" : {name: "Connecticut", football: true},
	"copst" : {name: "Coppin State", football: false},
	"corn" : {name: "Cornell", football: false},
	"cre" : {name: "Creighton", football: false},
	"dart" : {name: "Dartmouth", football: false},
	"dav" : {name: "Davidson", football: false},
	"day" : {name: "Dayton", football: false},
	"del" : {name: "Delaware", football: false},
	"delst" : {name: "Delaware State", football: false},
	"den" : {name: "Denver", football: false},
	"dep" : {name: "DePaul", football: false},
	"det" : {name: "Detroit University", football: false},
	"drake" : {name: "Drake", football: false},
	"dre" : {name: "Drexel", football: false},
	"duke" : {name: "Duke", football: true},
	"duq" : {name: "Duquesne", football: false},
	"ec" : {name: "East Carolina", football: true},
	"eten" : {name: "East Tennessee State", football: false},
	"eill" : {name: "Eastern Illinois", football: false},
	"eky" : {name: "Eastern Kentucky", football: false},
	"ewas" : {name: "Eastern Washington", football: false},
	"em" : {name: "Eastern Michigan", football: true},
	"elon" : {name: "Elon", football: false},
	"ev" : {name: "Evansville", football: false},
	"fai" : {name: "Fairfield", football: false},
	"fadi" : {name: "Fairleigh Dickinson", football: false},
	"fiu" : {name: "FIU", football: true}, // todo
	"fl" : {name: "Florida", football: true},
	"flam" : {name: "Florida A&M", football: false},
	"fla" : {name: "Florida Atlantic", football: true},
	"flgc" : {name: "Florida Gulf Coast", football: false},
	"flst" : {name: "Florida State", football: true},
	"ford" : {name: "Fordham", football: false},
	"fo" : {name: "Fort Wayne", football: false},
	"fresno" : {name: "Fresno State", football: true},
	"fur" : {name: "Furham", football: false},
	"gawe" : {name: "Gardner-Webb", football: false},
	"geom" : {name: "George Mason", football: false},
	"geow" : {name: "George Washington", football: false},
	"gtown" : {name: "Georgetown", football: false},
	"ga": {name: "Georgia", football: true},
	"gaso" : {name: "Georgia Southern", football: false},
	"gast" : {name: "Georgia State", football: true},
	"gatech" : {name: "Georgia Tech", football: true},
	"gon" : {name: "Gonzaga", football: false},
	"grast" : {name: "Grambling State", football: false},
	"gra" : {name: "Grand Canyon", football: false},
	"gb" : {name: "Wisc Green Bay", football: false},
	"hamp" : {name: "Hampton", football: false},
	"har" : {name: "Hartford", football: false},
	"harv" : {name: "Harvard", football: false},
	"haw" : {name: "Hawaii", football: true},
	"hp" : {name: "High Point", football: false},
	"hof" : {name: "Hofstra", football: false},
	"hc" : {name: "Holy Cross", football: false},
	"houb" : {name: "Houston Baptist", football: false},
	"how" : {name: "Howard", football: false},
	"hou" : {name: "Houston", football: true},
	"id" : {name: "Idaho", football: true},
	"idst" : {name: "Idaho State", football: false},
	"il" : {name: "Illinois", football: true},
	"ilst" : {name: "Illinois State", football: false},
	"incw" : {name: "Incarnate Word", football: false},
	"ind" : {name: "Indiana", football: true},
	"indst" : {name: "Indiana State", football: false},
	"ia" : {name: "Iowa", football: true},
	"iast" : {name: "Iowa State", football: true},
	"iona" : {name: "Iona", football: false},
	"iupui" : {name: "IUPUI", football: false}, // todo
	"jaxst" : {name: "Jackson State", football: false},
	"jac" : {name: "Jacksonville", football: false},
	"jacst" : {name: "Jacksonville State", football: false},
	"jmu" : {name: "James Madison", football: false},
	"kan" : {name: "Kansas", football: true},
	"kst" : {name: "Kansas State", football: true},
	"kenn" : {name: "Kennesaw State", football: false},
	"kentst" : {name: "Kent State", football: true},
	"kent" : {name: "Kentucky", football: true},
	"las" : {name: "La Salle", football: false}, // todo
	"laf" : {name: "Lafayette", football: false},
	"lam" : {name: "Lamar", football: false},
	"leh" : {name: "Lehigh", football: false},
	"lib" : {name: "Liberty", football: false},
	"lip" : {name: "Lipscomb", football: false},
	"lit" : {name: "Little Rock", football: false},
	"liu" : {name: "LIU Brooklyn", football: false}, // todo
	"lb" : {name: "Long Beach State", football: false},
	"lon" : {name: "Longwood", football: false},
	"lsu" : {name: "LSU", football: true},
	"latech" : {name: "Louisiana Tech", football: true},
	"lala" : {name: "UL - Lafayette", football: true},
	"lamo" : {name: "UL - Monroe", football: true}, // todo
	"lou" : {name: "Louisville", football: true},
	"loyc" : {name: "Loyola Chicago", football: false}, // todo
	"loymd" : {name: "Loyola Maryland", football: false}, // todo
	"loym" : {name: "Loyola Marymount", football: false}, // todo
	"maine" : {name: "Maine", football: false},
	"man" : {name: "Manhattan", football: false}, 
	"mar" : {name: "Marist", football: false},
	"marq" : {name: "Marquette", football: false},
	"mars" : {name: "Marshall", football: true},
	"md" : {name: "Maryland", football: true},
	"mdes" : {name: "MD Eastern Shore", football: false}, // todo
	"mass" : {name: "Massachusetts", football: true},
	"mcn" : {name: "McNeese State", football: false},
	"mer" : {name: "Mercer", football: false},
	"mem" : {name: "Memphis", football: true},
	"miafl" : {name: "Miami Florida", football: true},
	"miaoh" : {name: "Miami Ohio", football: true},
	"mi" : {name: "Michigan", football: true},
	"mist" : {name: "Michigan State", football: true},
	"midtenn" : {name: "Middle Tennessee", football: true},
	"milw" : {name: "Milwaukee", football: false},
	"minn" : {name: "Minnesota", football: true},
	"ms" : {name: "Ole Miss", football: true}, // todo
	"msst" : {name: "Mississippi State", football: true},
	"missv" : {name: "Miss Valley State", football: false},
	"mo" : {name: "Missouri", football: true},
	"most" : {name: "Missouri State", football: false},
	"mon" : {name: "Monmouth", football: false},
	"mont" : {name: "Montana", football: false},
	"montst" : {name: "Montana State", football: false},
	"more" : {name: "Morehead State", football: false},
	"morg" : {name: "Morgan State", football: false},
	"msm" : {name: "Mount Saint Marys", football: false}, // todo
	"murst" : {name: "Murray State", football: false},
	"navy" : {name: "Navy", football: true},
	"neb" : {name: "Nebraska", football: true},
	"nev" : {name: "Nevada", football: true},
	"nh" : {name: "New Hampshire", football: false},
	"nm" : {name: "New Mexico", football: true},
	"nmst" : {name: "New Mexico State", football: true},
	"no" : {name: "New Orleans", football: false},
	"nia" : {name: "Niagara", football: false},
	"nichst" : {name: "Nicholls State", football: false},
	"njit" : {name: "NJIT", football: false}, // todo
	"norfst" : {name: "Norfolk State", football: false},
	"nc" : {name: "North Carolina", football: true},
	"ncat" : {name: "North Carolina A&T", football: false},
	"nccu" : {name: "NCCU", football: false},
	"ncst" : {name: "North Carolina State", football: true},
	"nda" : {name: "North Dakota", football: false},
	"ndast" : {name: "North Dakota State", football: false},
	"nfl" : {name: "North Florida", football: false},
	"nt" : {name: "North Texas", football: false},
	"ne" : {name: "Northeastern", football: false},
	"naz" : {name: "Northern Arizona", football: false},
	"nco": {name: "No. Colorado", football: false},
	"niu" : {name: "NIU", football: true}, // todo
	"niowa" : {name: "Northern Iowa", football: false},
	"nky" : {name: "Northern Kentucky", football: false},
	"nw" : {name: "Northwestern", football: true},
	"nwst" : {name: "Northwestern State", football: false},
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
	"penn" : {name: "Penn", football: false},
	"ps" : {name: "Penn State", football: true},
	"pep" : {name: "Pepperdine", football: false},
	"pit" : {name: "Pittsburgh", football: true},
	"por" : {name: "Portland University", football: false},
	"porst" : {name: "Portland State", football: false},
	"prvam" : {name: "Prairie View A&M", football: false},
	"pres" : {name: "Presbyterian", football: false},
	"pri" : {name: "Princeton", football: false},
	"pro" : {name: "Providence", football: false},
	"pur" : {name: "Purdue", football: true},
	"qui" : {name: "Quinnipiac", football: false},
	"rad" : {name: "Radford", football: false},
	"rho" : {name: "Rhode Island", football: false},
	"rice" : {name: "Rice", football: true},
	"rich" : {name: "Richmond", football: false},
	"rid" : {name: "Rider", football: false},
	"rm" : {name: "Robert Morris", football: false},
	"rut" : {name: "Rutgers", football: true},
	"sacst" : {name: "Sacramento State", football: false},
	"sach" : {name: "Sacred Heart", football: false},
	"stb" : {name: "St. Bonaventure", football: false}, // todo
	"stf" : {name: "St. Francis Brooklyn", football: false}, // todo
	"stfpa" : {name: "St. Francis PA", football: false}, // todo
	"stj" : {name: "Saint Johns", football: false}, // todo
	"stjoe" : {name: "Saint Josephs", football: false}, // todo
	"stl" : {name: "Saint Louis", football: false}, // good bo
	"stm" : {name: "Saint Marys CA", football: false}, 
	"stp" : {name: "St. Peter's", football: false},
	"samh" : {name: "Sam Houston State", football: false},
	"samf" : {name: "Samford", football: false},
	"sd" : {name: "San Diego", football: false},
	"sdst" : {name: "San Diego State", football: true},
	"sanf" : {name: "San Francisco", football: false},
	"sjst" : {name: "San Jose State", football: true},
	"sant" : {name: "Santa Clara", football: false},
	"sav" : {name: "Savannah State", football: false},
	"sea" : {name: "Seattle", football: false},
	"set" : {name: "Seton Hall", football: false},
	"sie" : {name: "Siena", football: false},
	"siu" : {name: "SIU Edwardsville", football: false},
	"smu" : {name: "SMU", football: true},
	"sal" : {name: "South Alabama", football: true},
	"sc" : {name: "South Carolina", football: true},
	"scst" : {name: "SC State", football: false},
	"scu" : {name: "South Carolina Upstate", football: false},
	"sda" : {name: "South Dakota", football: false},
	"sdast" : {name: "South Dakota State", football: false},
	"usf" : {name: "South Florida", football: true},
	"semost" : {name: "SE Missouri State", football: false},
	"selou" : {name: "SE Louisiana", football: false},
	"sil" : {name: "Southern Illinois", football: false},
	"smi" : {name: "Southern Miss", football: true},
	"south" : {name: "Southern", football: false},
	"suta" : {name: "Southern Utah", football: false},
	"sta" : {name: "Stanford", football: true},
	"sfa" : {name: "Stephen F. Austin", football: false},
	"stet" : {name: "Stetson", football: false},
	"sb" : {name: "Stony Brook", football: false},
	"syr" : {name: "Syracuse", football: true},
	"tcu" : {name: "TCU", football: true},
	"tem" : {name: "Temple", football: true},
	"ten" : {name: "Tennessee", football: true},
	"tenmart" : {name: "UT-Martin", football: false},
	"tenst" : {name: "Tennessee State", football: false},
	"tentc" : {name: "Tennessee Tech", football: false},
	"tex" : {name: "Texas", football: true},
	"texam" : {name: "Texas A&M", football: true},
	"texamcc": {name: "Texas A&M Corpus Christi", football: false}, // todo
	"texar" : {name: "UT Arlington", football: false},
	"texs" : {name: "Texas Southern", football: false},
	"texst" : {name: "Texas State", football: true},
	"textc" : {name: "Texas Tech", football: true},
	"tol" : {name: "Toledo", football: true},
	"tow" : {name: "Towson", football: false},
	"troy" : {name: "Troy", football: true},
	"tula" : {name: "Tulane", football: true},
	"tuls" : {name: "Tulsa", football: true},
	"uab" : {name: "UAB", football: true},
	"ucda" : {name: "UC Davis", football: false}, // good for BO
	"ucr" : {name: "UC Riverside", football: false}, // todo
	"uci" : {name: "UC Irvine", football: false},
	"ucsb" : {name: "Cal Santa Barbara", football: false},
	"ucf" : {name: "Central Florida", football: true},
	"ucla" : {name: "UCLA", football: true},
	"uic" : {name: "Illinois Chicago", football: false},
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
	"valp" : {name: "Valparaiso", football: false},
	"van" : {name: "Vanderbilt", football: true},
	"ver" : {name: "Vermont", football: false},
	"vil" : {name: "Villanova", football: false},
	"vcu" : {name: "Virginia Commonwealth", football: false},
	"va" : {name: "Virginia", football: true},
	"vatech" : {name: "Virginia Tech", football: true},
	"vmi" : {name: "VMI", football: false},
	"wagner" : {name: "Wagner", football: false},
	"wake" : {name: "Wake Forest", football: true},
	"was" : {name: "Washington University", football: true},
	"wasst" : {name: "Washington State", football: true},
	"web" : {name: "Weber State", football: false},
	"wv" : {name: "West Virginia", football: true},
	"wcar" : {name: "Western Carolina", football: false},
	"wil" : {name: "Western Illinois", football: false},
	"wky" : {name: "Western Kentucky", football: true},
	"wmi" : {name: "Western Michigan", football: true},
	"wic" : {name: "Wichita State", football: false}, // todo
	"wandm" : {name: "William & Mary", football: false}, // todo
	"win" : {name: "Winthrop", football: false},
	"wis" : {name: "Wisconsin", football: true},
	"wof" : {name: "Wofford", football: false},
	"wrs" : {name: "Wright State", football: false}, // todo
	"wy" : {name: "Wyoming", football: true},
	"xav" : {name: "Xavier", football: false},
	"yale": {name: "Yale", football: false},
	"ys" : {name: "Youngstown State", football: false}
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
		getAllLines(teamOne, teamTwo, sportsEvent, function(retVal, teams, league) {
				if(DEBUG) { 
					console.log("using S3 file", league); 
					console.log("searching these", teams);
				}

				parseString(retVal, function(err, lines) {
					var speech = "";
					var result = {};
					var found = false;

					if(!lines || !lines.bestlinesports_line_feed) {
						console.error("No spreads returned!");
						speech = getCouldntFindOddsError(teamParsed);
						found = true; // nothing to parse.
					}

					for(var teamIdx = 0; teamIdx < teams.length && !found; teamIdx++) {
						var teamParsed = (teams && teams[teamIdx] && teams[teamIdx]['team']) ? teams[teamIdx]['team']['name'] : null;
					
						for(var i = 0; i < lines.bestlinesports_line_feed.event.length && !found; i++) {
							var game = lines.bestlinesports_line_feed.event[i];
							if(DEBUG && false) {
								console.log("GAME", JSON.stringify(game));
							}
							if(game.period[0].period_description[0] !== 'Game') {
								continue;
							}
							var team1 = lines.bestlinesports_line_feed.event[i].participant[0];
							var team2 = lines.bestlinesports_line_feed.event[i].participant[1];	
							if(DEBUG) {
								console.log("Checking", teamParsed, "against", team1.participant_name[0], team2.participant_name[0]);
							}
							if(team1.participant_name[0] === teamParsed) {
								var onTheRoad = (team1.visiting_home_draw[0] === "Visiting");
								var line;	
								if(league === "ALL") {
									league = getLeagueName(game.league[0]);
								}								
								if(onTheRoad) {
									line = result['line'] = game.period[0].spread[0].spread_visiting[0];
								} else {
									line = result['line'] = game.period[0].spread[0].spread_home[0];
								}
								if(line === '') {
									speech = noSpread(teamParsed, team2.participant_name[0], league);
								} else {
									if(league === "ALL") {
										league = getLeagueName(game.league[0]);
									}
									speech = spreadToSpeech(line, teamParsed, team2.participant_name[0], onTheRoad, league);
								}
								result["teamOne"] = teamParsed;
								result["teamOneOnTheRoad"] = onTheRoad;
								result['teamTwo'] = team2.participant_name[0];
								result['teamOneML'] = team1.odds[0].moneyline;
								result['teamTwoML'] = team2.odds[0].moneyline;
								found = true; 
							}  else if(team2.participant_name[0] === teamParsed) {
								var onTheRoad = (team2.visiting_home_draw[0] === "Visiting");
								var line;	
								if(league === "ALL") {
									league = getLeagueName(game.league[0]);
								}							
								if(onTheRoad) {
									line = result['line'] = game.period[0].spread[0].spread_visiting[0];
								} else {
									line = result['line'] = game.period[0].spread[0].spread_home[0];
								}
								if(line === '') {
									speech = noSpread(teamParsed, team1.participant_name[0], league);
								} else {
									speech = spreadToSpeech(line, teamParsed, team1.participant_name[0], onTheRoad, league);
								}
								result["teamOne"] = teamParsed;
								result["teamOneOnTheRoad"] = onTheRoad;
								result['teamTwo'] = team1.participant_name[0];
								result['teamOneML'] = team2.odds[0].moneyline;
								result['teamTwoML'] = team1.odds[0].moneyline;
								found = true;
							} // TODO handle neutral site games
							else if (DEBUG) { console.log("no match."); }
							if(found) {
								result['ou'] = game.period[0].total[0].total_points;
								if(result['ou'] && result['ou'] != '' && result['ou'] != ' ') {
									speech += "The over under is " + result['ou'] + " points. ";
								}
								if(DEBUG) {
									console.log("Result", result);
								}
								break;
							}
						}
						if(found) {
							if(DEBUG) { console.log("FOUND MATCH!"); }
							break; // return the first match
						}
					}
					var card = true;
					if(!speech) {
						if(league === "ALL") {
							speech = getMoreSpecificError(teamOne);
						} else {
							speech = getCouldntFindOddsError(teams);
						}
						card = false;
					}
					self.attributes.lastSearch = result;
					self.attributes.lastSearch.speech = speech;
					console.log("Going to return: " + speech, "card=", card);
					if(!card) {
						self.emit(":tell", speech);
					} else {
						var cardTitle;
						if(result["teamOneOnTheRoad"]) {
							cardTitle = result['teamTwo'] + " vs. " + result['teamOne'] + " odds";
						} else {
							cardTitle = result['teamOne'] + " vs. " + result['teamTwo'] + " odds";
						}
						var cardContent = speech;
						self.emit(":tellWithCard", speech, cardTitle, cardContent);
					}
				}); 
		}, function() {
			var temp = [teamOne];
			self.emit(":tell", getCouldntFindTeamError(temp));
		});
	} else {
		console.error("Don't have team one to search!");
		this.emit(":ask", HELP_MESSAGE + getGenericHelpMessage());
	}
}


// =====================================================================================================
// ------------------------------- Section 3. Generating Speech Messages -------------------------------
// =====================================================================================================

function getGenericHelpMessage(){
	return "You can ask game lines for the odds to any upcoming game, for example 'the Steelers' or 'the Duke basketball game.'";
}

function getMoreSpecificError(userInput) {
	return "I couldn't find odds for " + appendThe(userInput) + " game taking place today. Please try again and tell me specifically which team name and sport to search for.";
}

function getLeagueName(leagueName) {
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

function appendThe(teamName) {
	if(!teamName.toLowerCase().substring(0, 4).includes("the")) {
		return "the " + teamName;	
	}
	return teamName;
}

function getCouldntFindOddsError(teams) {
	if(teams && teams.length >= 1) {
		return "I do not have odds for " + appendThe(teams[0]["team"]["name"]) + " game yet. Please try again later.";
	} else {
		console.error("getCouldntFindOddsError entering with 0 teams!"); // shouldn't ever happen
		return "I do not have odds for that game yet. Please try again later.";
	}
}

function getCouldntFindTeamError(userInput) {
	if(userInput && userInput !== "the") {
		return "I couldn't find a team with the name " + userInput + ". Please try again.";
	}
	return "I couldn't find the team you asked for. Please try again.";
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

	var matches = [];

	if(sportsEvent) {
		if(sportsEvent.includes("college") || sportsEvent.includes("n. c. a. a.") || sportsEvent.includes("ncaa")) {
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
				matches.push(ncaa);
				teamObj = ncaa;
			}
		} else if(sportsEvent.includes("n. f. l.") || sportsEvent.includes("nfl") || sportsEvent.includes("nf l")) {
			teamObj = getNFLTeamName(teamOne);
			if(teamObj) {
				matches.push(teamObj);
				league = "NFL";
			}
		} else if(sportsEvent.includes("n. b. a.") || sportsEvent.includes("nba") || sportsEvent.includes("nb a")) {
			teamObj = getNBATeamName(teamOne);
			if(teamObj) {
				matches.push(teamObj);
				league = "NBA";
			}
		} else if(sportsEvent.includes("football")) {
			// could be NFL or NCAA..
			teamObj = getNFLTeamName(teamOne);
			if(teamObj) {
				matches.push(teamObj);
			}
			league = "NFL";
			if(!teamObj || (teamObj && !teamObj.exactMatch)) {
				var ncaa = getNCAATeamName(teamOne); // dont override teamObj in case its a non-exact match
				if(ncaa) {
					matches.push(ncaa);
				}			
			}
		} else if(sportsEvent.includes("basketball")) {
			// could be NBA or NCAA.
			teamObj = getNBATeamName(teamOne);
			if(teamObj) {
				matches.push(teamObj);
				league = "NBA";	
			}		
			if(!teamObj || (teamObj && !teamObj.exactMatch)) {
				var ncaa = getNCAATeamName(teamOne); // dont override teamObj in case its a non-exact match
				if(ncaa) {
					matches.push(ncaa);
					league = "CBB";	
				}
			}	
		} else {
			if(DEBUG) {
				console.log("unknown league");
			}
		}
	} else if(teamTwo) {
		// try NFL first.
		var t1 = getNFLTeamName(teamOne);
		if(t1 && (t1.exactMatch || getNFLTeamName(teamTwo))) {
			teamObj = t1;
			league = "NFL";	
			matches.push(teamObj);
		} 

		//if(!teamObj) {
			// try NBA
			t1 = getNBATeamName(teamOne);
			if(t1 && (t1.exactMatch || getNBATeamName(teamTwo))) {
				teamObj = t1;
				league = "NBA";
				matches.push(t1);
			}
		//}

		//if(!teamObj) {
			t1 = getNCAATeamName(teamOne);
			var t2 = getNCAATeamName(teamTwo);
			if(t1 &&  t2) {
				teamObj = t1;
				if(!t1.football || !t2.football) {
					// one of these teams doesn't have a football team, so this must be a basketball matchup.
					league = "CBB";
				} else {
					league = "ALL";
				}
				matches.push(t1);
			}
		//}
	} else {
		if(DEBUG) {
			console.log("1 team name only.");
		}
		// we only have 1 team name to work with.
		teamObj = getNFLTeamName(teamOne);

		if(teamObj) {
			matches.push(teamObj);
			league = "NFL";
		}


		if(!teamObj || (teamObj && !teamObj.exactMatch)) {

			var ncaa = getNCAATeamName(teamOne);
			if(ncaa) {
				teamObj = ncaa;
				if(teamObj && !teamObj.team.football) {
					// team doesn't have a football team. must be BB 
					if(DEBUG) {
						console.log(teamOne + " is a basketball only school.");
					}
					league = "CBB";
				} else {
					league = "ALL";
				}
				matches.push(ncaa);
			} 
			var nba = getNBATeamName(teamOne);
			if(nba) { 
				matches.push(nba);
				league = "NBA";
			}
		} 		
	}
	if(matches.length === 0) {
		teamNotFoundCallback();
		return;
	} else if(DEBUG && matches.length === 1) {
		console.log("league", league, "teamObj", matches[0]);
	} else {
		if(DEBUG) {
			console.log("multiple matches", matches);
		}
		league = "ALL";
	}

	var params = {
		Bucket: S3_BUCKET_NAME,
		Key: league
	};	
	s3.getObject(params, function(err, data) {
		if(err) {
			if(DEBUG) {
				console.log(err, err.stack);
			}
			console.log("getting up to date line info", league);
			updateOdds(teamObj, league, successCallback);
		} else {
			var staleOdds = new Date(data.LastModified);
			staleOdds.setHours(staleOdds.getHours() + HOURS_TO_KEEP_ODDS);
			var timestamp = new Date();
			if(timestamp > staleOdds) {
				// odds are HOURS_TO_KEEP_ODDS hours old, update them.
				console.log("Odds were last updated: " + data.LastModified + ", greater than " + HOURS_TO_KEEP_ODDS + " hours old, updating.");
				updateOdds(matches, league, successCallback);
			} else {
				if(DEBUG) {
					console.log("Odds were last updated: " + data.LastModified + ", no need to update since it is less than " + HOURS_TO_KEEP_ODDS + " hours old.");
				}
				successCallback(data.Body.toString('ascii'), matches, league);
			}
		}
	});

}

function spreadToSpeech(spread, teamOne, teamTwo, teamOneOnTheRoad, league) {
	if(DEBUG) { console.log("spreadToSpeech", spread); }
	var where = teamOneOnTheRoad ? "on the road" : "at home";
	var singular = (league === "CFB" || league === "CBB");

	// change "No." to "North"
	// could check for 'northern' as opposed to 'north' .. but I'm lazy
	if(teamOne.includes("No.")) {
		teamOne = teamOne.replace("No.", "North");
	}
	if(teamTwo.includes("No.")) {
		teamTwo = teamTwo.replace("No.", "North");
	}

	var speech;
	if(singular) {
		speech = teamOne + " is ";
	} else {
		speech = "The " + teamOne + " are ";
	}
	var spreadAsNum = parseInt(spread);
	if(spreadAsNum === 0) {
		speech += "at even odds against ";
	} else if(spreadAsNum < 0) {
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
	if(i.includes("abilene")) {
		return {team: NCAA_TEAMS["ab"]};
	} else if(i.includes("air") && i.includes("force")) {
		return {team: NCAA_TEAMS["af"]};
	} else if(i.includes("akron")) {
		return {team: NCAA_TEAMS["ak"]};
	} else if(i.includes("alabama")) {
		if(i.includes("south")) {
			return {team: NCAA_TEAMS["sal"]};
		} else if(i.includes("a and m") || i.includes("a. and m")) {
			return {team: NCAA_TEAMS["alam"]};
		}
		return {team: NCAA_TEAMS["al"]};
	} else if(i.includes("albany")) {
		return {team: NCAA_TEAMS["alb"]};	
	} else if(i.includes("corn") && i.includes("state")) {
		return {team: NCAA_TEAMS["alco"]};
	} else if(i.includes("american")) {
		return {team: NCAA_TEAMS["am"]};
	} else if(i.includes("appalachian") || (i.includes("app") && i.includes("state"))) {
		return {team: NCAA_TEAMS["apst"]};
	} else if(i.includes("arizona")) {
		if(i.includes("state")) {
			return {team: NCAA_TEAMS["azst"]};
		} else if(i.includes("north")) {
			return {team: NCAA_TEAMS["naz"]};
		} else {
			return {team: NCAA_TEAMS["az"]};
		}
	} else if(i.includes("arkansas")) {
		if(i.includes("State")) {
			return {team: NCAA_TEAMS["arkst"]};
		} else if(i.includes("pine") || i.includes("bluff")) {
			return {team: NCAA_TEAMS["arkpb"]};
		} else if(i.includes("central")) {
			return {team: NCAA_TEAMS["cena"]};
		} else {
			return {team: NCAA_TEAMS["ark"]};
		}
	} else if(i.includes("army")) {
		return {team: NCAA_TEAMS["army"]};
	} else if(i.includes("auburn")) {
		return {team: NCAA_TEAMS["aub"]};
	} else if(i.includes("austin")) {
		if(i.includes("stephen") || i.includes("steven")) {
			return {team:NCAA_TEAMS["sfa"]};
		} 
		return {team: NCAA_TEAMS["ausp"]};
	} else if(i.includes("ball state")) {
		return {team: NCAA_TEAMS["ballst"]};
	} else if(i.includes("baylor") || i.includes("bailey")) { // wth alexa
		return {team: NCAA_TEAMS["bay"]};
	} else if(i.includes("belmont")) {
		return {team: NCAA_TEAMS["bel"]};
	} else if(i.includes("beth") && i.includes("cook")) {
		return {team: NCAA_TEAMS["beth"]};
	} else if(i.includes("binghamton")) { // todo
		return {team: NCAA_TEAMS["bin"]};
	} else if(i.includes("boise")) {
		return {team: NCAA_TEAMS["boi"]};
	} else if(i.includes("boston")) {
		if(i.includes("college")) {
			return {team: NCAA_TEAMS["bc"]};
		}
		return {team: NCAA_TEAMS["bos"]};
	} else if(i.includes("bowling")) {
		return {team: NCAA_TEAMS["bg"]};
	} else if(i.includes("bradley")) {
		return {team: NCAA_TEAMS["bra"]};
	} else if(i.includes("brown")) {
		return {team: NCAA_TEAMS["bro"]};
	} else if(i.includes("bryan") || i.includes("brian")) {
		return {team: NCAA_TEAMS["bry"]};
	} else if(i.includes("bucknell")) {
		return {team: NCAA_TEAMS["buck"]};
	} else if(i.includes("buffalo")) {
		return {team: NCAA_TEAMS["buf"], exactMatch: false}; // NFL -> bills
	} else if(i.includes("butler")) {
		return {team: NCAA_TEAMS["but"]};
	} else if(i.includes("byu") || i.includes("b. y. u.") || i.includes("brigham")) {
		return {team: NCAA_TEAMS["byu"]};
	} else if(i.includes("cal")) {
		if(i.includes("state")) {
			if(i.includes("baker")) {
				return {team: NCAA_TEAMS["calbak"]};
			} else if(i.includes("fuller")) {
				return {team: NCAA_TEAMS["calful"]};
			} else if(i.includes("north")) {
				return {team: NCAA_TEAMS["calnor"]};
			} else if(i.includes("poly")) {
				return {team: NCAA_TEAMS["calpoly"]};
			} else {
				console.log("Couldn't find cal state team", i);
				return null;
			}
		} else if(i.includes("irvine")) {
			return {team: NCAA_TEAMS["uci"]};
		} else if(i.includes("barbara")) {
			return {team: NCAA_TEAMS["ucb"]};
		}
		return {team: NCAA_TEAMS["cal"]};
	} else if(i.includes("campbell")) {
		return {team: NCAA_TEAMS["camp"]};
	} else if(i.includes("canisius")) {
		return {team: NCAA_TEAMS["can"]};
	} else if(i.includes("carolina")) {
		if(i.includes("east")) {
			return {team: NCAA_TEAMS["ec"]};
		} else if(i.includes("state")) {
			return {team: NCAA_TEAMS["ncst"]};
		} else if(i.includes("north")) {
			return {team: NCAA_TEAMS["nc"]};
		} else if(i.includes("south")) {
			if(i.includes("state")) {
				return {team: NCAA_TEAMS["scu"]};
			}
			return {team: NCAA_TEAMS["sc"]};
		} else if(i.includes("a and t") || i.includes("a. and t")) {
			return {team: NCAA_TEAMS["ncat"]};
		} else if(i.includes("central")) {
			return {team: NCAA_TEAMS["nccu"]};
		} else if(i.includes("west")) {
			return {team: NCAA_TEAMS["wcar"]};
		} else {
			console.log("Couldn't find carolina team", i);
			return null;
		}
	} else if(i.includes("central")) {
		return {team: NCAA_TEAMS["cmi"]};
	} else if(i.includes("charleston")) {
		if(i.includes("south")) {
			return {team: NCAA_TEAMS["chso"]};
		}
		return {team: NCAA_TEAMS["ch"]};
	} else if(i.includes("charlotte")) {
		return {team: NCAA_TEAMS["cha"]};
	} else if(i.includes("chattanooga")) {
		return {team: NCAA_TEAMS["chat"]};
	} else if(i.includes("chicago")) {
		return {team: NCAA_TEAMS["chist"]};
	} else if(i.includes("cincinnati")) {
		return {team: NCAA_TEAMS["cin"]};
	} else if(i.includes("citadel")) {
		return {team: NCAA_TEAMS["cit"]};
	} else if(i.includes("clemson")) {
		return {team: NCAA_TEAMS["cle"]};
	} else if(i.includes("cleveland")) {
		return {team: NCAA_TEAMS["clest"]};
	} else if(i.includes("coast")) {
		return {team: NCAA_TEAMS["cc"]};
	} else if(i.includes("colgate")) {
		return {team: NCAA_TEAMS["colg"]};
	} else if(i.includes("colorado")) {
		if(i.includes("state")) {
			return {team: NCAA_TEAMS["colst"]};
		} else if(i.includes("north")) {
			return {team: NCAA_TEAMS["nco"]};
		} else {
			return {team: NCAA_TEAMS["co"]};
		}
	} else if(i.includes("columbia")) {
		return {team: NCAA_TEAMS["colu"]};		
	} else if(i.includes("connecticut")) {
		if(i.includes("central")) {
			return {team: NCAA_TEAMS["cenc"]};
		}		
		return {team: NCAA_TEAMS["con"]};
	} else if(i.includes("coppin") && i.includes("state")) {
		return {team: NCAA_TEAMS["copst"]};
	} else if(i.includes("cornell")) {
		return {team: NCAA_TEAMS["corn"]};
	} else if(i.includes("creighton")) {
		return {team: NCAA_TEAMS["cre"]};
	} else if(i.includes("dakota")) {
		if(i.includes("north")) {
			if(i.includes("state")) {
				return {team: NCAA_TEAMS["ndast"]};
			}
			return {team: NCAA_TEAMS["nda"]};
		} else if(i.includes("south")) {
			if(i.includes("state")) {
				return {team: NCAA_TEAMS["sdast"]};
			}
			return {team: NCAA_TEAMS["sda"]};
		} else {
			console.log("Couldn't find dakota team", i);
		}
	} else if(i.includes("dart") && i.includes("mouth")) {
		return {team: NCAA_TEAMS["dart"]};
	} else if(i.includes("davidson")) {
		return {team: NCAA_TEAMS["dav"]};
	} else if(i.includes("dayton")) {
		return {team: NCAA_TEAMS["day"]};
	} else if(i.includes("delaware")) {
		if(i.includes("state")) {
			return {team: NCAA_TEAMS["delst"]};
		}
		return {team: NCAA_TEAMS["del"]};
	} else if(i.includes("denver")) {
		return {team: NCAA_TEAMS["den"]};
	} else if(i.includes("paul")) {
		return {team: NCAA_TEAMS["dep"]};
	} else if(i.includes("detroit")) {
		return {team: NCAA_TEAMS["det"]};
	} else if(i.includes("duke")) {
		return {team: NCAA_TEAMS["duke"]};
	} else if(i.includes("drake")) {
		return {team: NCAA_TEAMS["drake"]};
	} else if(i.includes("drexel")) {
		return {team: NCAA_TEAMS["dre"]};
	} else if(i.includes("duquesne")) {
		return {team: NCAA_TEAMS["duq"]};
	} else if(i.includes("elon")) {
		return {team: NCAA_TEAMS["elon"]};
	} else if(i.includes("evansville")) {
		return {team: NCAA_TEAMS["ev"]};
	} else if(i.includes("fair") && i.includes("field")) {
		return {team: NCAA_TEAMS["fai"]};
	} else if(i.includes("fair") && i.iuncludes("dick")) {
		return {team: NCAA_TEAMS["fadi"]};
	} else if(i.includes("fiu") || i.includes("f. i. u.") || (i.includes("florida") && i.includes("international"))) {
		return {team: NCAA_TEAMS["fiu"]};
	} else if(i.includes("florida")) {
		if(i.includes("atlantic")) {
			return {team: NCAA_TEAMS["fla"]};
		} else if(i.includes("state")) {
			return {team: NCAA_TEAMS["flst"]};
		} else if(i.includes("miami")) {
			return {team: NCAA_TEAMS["miafl"]};
		} else if(i.includes("south")) {
			return {team: NCAA_TEAMS["usf"]};
		} else if(i.includes("central")) {
			return {team: NCAA_TEAMS["ucf"]};
		} else if(i.includes("gulf") && i.includes("coast")) {
			return {team: NCAA_TEAMS["flgc"]};
		} else if(i.includes("north")) {
			return {team: NCAA_TEAMS["nfl"]};
		} else if(i.includes("a and m") || i.includes("a. and m")) {
			return {team: NCAA_TEAMS["flam"]};
		} else {
			return {team: NCAA_TEAMS["fl"]};
		}
	} else if(i.includes("fordham")) {
		return {team: NCAA_TEAMS["ford"]};
	} else if(i.includes("fort") && i.includes("wayne")) {
		return {team: NCAA_TEAMS["fo"]};
	} else if(i.includes("fresno")) {
		return {team: NCAA_TEAMS["fresno"]};
	} else if(i.includes("furham")) {
		return {team: NCAA_TEAMS["fur"]};
	} else if(i.includes("web") && (i.includes("gardner") || i.includes("gardener"))) {
		return {team: NCAA_TEAMS["gawe"]};
	} else if(i.includes("george")) {
		if(i.includes("mason")) {
			return {team: NCAA_TEAMS["geom"]};
		} else if(i.includes("washington")) {
			return {team: NCAA_TEAMS["geow"]};
		} else if(i.includes("town")) {
			return {team: NCAA_TEAMS["gtown"]};
		} else {
			console.log("Couldn't find george team", i); // todo
			return null;
		}
	} else if(i.includes("georgia")) {
		if(i.includes("state")) {
			return {team: NCAA_TEAMS["gast"]};
		} else if(i.includes("tech")) {
			return {team: NCAA_TEAMS["gatech"]};
		} else if(i.includes("south")) {
			return {team: NCAA_TEAMS["gaso"]};
		} else {	
			return {team: NCAA_TEAMS["ga"]};
		}
	} else if(i.includes("gonzaga")) {
		return {team: NCAA_TEAMS["gon"]};
	} else if(i.includes("grambling") && i.includes("state")) {
		return {team: NCAA_TEAMS["grast"]};
	} else if(i.includes("grand") && i.includes("canyon")) {
		return {team: NCAA_TEAMS["gra"]};
	} else if(i.includes("green") && i.includes("bay")) {
		return {team: NCAA_TEAMS["gb"]};
	} else if(i.includes("hampton")) {
		return {team: NCAA_TEAMS["hamp"]};
	} else if(i.includes("hartford")) {
		return {team: NCAA_TEAMS["har"]};
	} else if(i.includes("harvard")) {
		return {team: NCAA_TEAMS["harv"]};
	} else if(i.includes("hawaii")) {
		return {team: NCAA_TEAMS["haw"]};
	} else if(i.includes("high") && i.includes("point")) {
		return {team: NCAA_TEAMS["hp"]};
	} else if(i.includes("hofstra")) {
		return {team: NCAA_TEAMS["hof"]};
	} else if(i.includes("holy") && i.includes("cross")) {
		return {team: NCAA_TEAMS["hc"]};
	} else if(i.includes("houston")) {
		if(i.includes("baptist")) {
			return {team: NCAA_TEAMS["houb"]};
		} else if(i.includes("sam") && i.includes("state")) {
			return {team: NCAA_TEAMS["samh"]};
		}
		return {team: NCAA_TEAMS["hou"]};
	} else if(i.includes("howard")) {
		return {team: NCAA_TEAMS["how"]};
	} else if(i.includes("idaho")) {
		if(i.includes("state")) {
			return {team: NCAA_TEAMS["idst"]};
		}
		return {team: NCAA_TEAMS["id"]};
	} else if(i.includes("illinois")) {
		if(i.includes("north")) {
			return {team: NCAA_TEAMS["niu"]};
		} else if(i.includes("chicago")) {
			return {team: NCAA_TEAMS["uic"]};
		} else if(i.includes("east")) {
			return {team: NCAA_TEAMS["eill"]};
		} else if(i.includes("state")) {
			return {team: NCAA_TEAMS["ilst"]};
		} else if(i.includes("west")) {
			return {team: NCAA_TEAMS["wil"]};
		}
		return {team: NCAA_TEAMS["il"]};
	} else if(i.includes("incarnarate")) { // todo test
		return {team: NCAA_TEAMS["incw"]};
	} else if(i.includes("indiana")) {
		if(i.includes("purdue")) {
			return {team: NCAA_TEAMS["iupui"]};
		} else if(i.includes("state")) {
			return {team: NCAA_TEAMS["indst"]};
		}
		return {team: NCAA_TEAMS["ind"]};
	} else if(i.includes("iona") && !i.includes("national")) {
		return {team: NCAA_TEAMS["iona"]};
	} else if(i.includes("iowa")) {
		if(i.includes("state")) {
			return {team: NCAA_TEAMS["iast"]};
		} else if(i.includes("north")) {
			return {team: NCAA_TEAMS["niowa"]};
		}
		return {team: NCAA_TEAMS["ia"]};
	} else if(i.includes("iupui")) {
		return {team: NCAA_TEAMS["iupui"]};
	} else if(i.includes("jacksonville")) {
		if(i.includes("state")) {
			return {team: NCAA_TEAMS["jacst"]};
		}
		return {team: NCAA_TEAMS["jac"]};	
	} else if(i.includes("jackson") && i.includes("state")) {
		return {team: NCAA_TEAMS["jaxst"]};
	} else if(i.includes("james") && i.includes("madison")) {
		return {team: NCAA_TEAMS["jmu"]};
	} else if(i.includes("kansas")) {
		if(i.includes("state")) {
			return {team: NCAA_TEAMS["kst"]};
		}
		return {team: NCAA_TEAMS["kan"]};
	} else if(i.includes("kennesaw")) {
		return {team: NCAA_TEAMS["kenn"]};	
	} else if(i.includes("kentucky")) { // do before 'kent st'
		if(i.includes("west")) {
			return {team: NCAA_TEAMS["wky"]};
		} else if(i.includes("north")) {
			return {team: NCAA_TEAMS["nky"]};
		} else if(i.includes("east")) {
			return {team: NCAA_TEAMS["eky"]};
		}
		return {team: NCAA_TEAMS["kent"]};
	} else if(i.includes("kent")) {
		return {team: NCAA_TEAMS["kentst"]};
	} else if(i.includes("salle")) {
		return {team: NCAA_TEAMS["las"]};
	} else if(i.includes("lafayette")) { // todo test
		return {team: NCAA_TEAMS["laf"]};
	} else if(i.includes("lamar")) {
		return {team: NCAA_TEAMS["lamar"]};
	} else if(i.includes("lehigh")) {
		return {team: NCAA_TEAMS["leh"]};
	} else if(i.includes("liberty")) {
		return {team: NCAA_TEAMS["lib"]};
	} else if(i.includes("lipscomb")) {
		return {team: NCAA_TEAMS["lip"]};
	} else if(i.includes("little") && i.includes("rock")) {
		return {team: NCAA_TEAMS["lit"]};
	} else if(i.includes("liu") || i.includes("l. i. u.")) {
		return {team: NCAA_TEAMS["liu"]};
	} else if(i.includes("long")) {
		if(i.includes("beach")) {
			return {team: NCAA_TEAMS["lb"]};
		} else if(i.includes("wood")) {
			return {team: NCAA_TEAMS["lon"]};
		} else {
			console.log("Couldn't find long team", i);
			return null;
		}
	} else if(i.includes("lsu") || i.includes("l. s. u.")) {
		return {team: NCAA_TEAMS["lsu"]};
	} else if(i.includes("louisiana")) {
		if(i.includes("state")) {
			return {team: NCAA_TEAMS["lsu"]};
		} else if(i.includes("tech")) {
			return {team: NCAA_TEAMS["latech"]};
		} else if(i.includes("fayette")) {
			return {team: NCAA_TEAMS["lala"]};
		} else if(i.includes("monroe")) {
			return {team: NCAA_TEAMS["lamo"]};
		} else {
			console.log("Couldn't find louisiana team", i);
			return null;
		}
	} else if(i.includes("louisville")) {
		return {team: NCAA_TEAMS["lou"]};
	} else if(i.includes("loyola")) {
		if(i.includes("chicago")) {
			return {team: NCAA_TEAMS["loyc"]};
		} else if(i.includes("maryland") || i.includes("md")) {
			return {team: NCAA_TEAMS["loymd"]};
		} else if(i.includes("mount")) {
			return {team: NCAA_TEAMS["loym"]};
		} else {
			console.log("Couldn't find loyola team", i);
			return null; // TODO tell user to be more specific!
		}
	} else if(i.includes("main")) {
		return {team: NCAA_TEAMS["maine"]};	
	} else if(i.includes("manhattan")) {
		return {team: NCAA_TEAMS["man"]};
	} else if(i.includes("marist")) {
		return {team: NCAA_TEAMS["mar"]};
	} else if(i.includes("marshall")) {
		return {team: NCAA_TEAMS["mars"]};
	} else if(i.includes("marquette")) {
		return {team: NCAA_TEAMS["marq"]};
	} else if(i.includes("maryland")) {
		if(i.includes("east") || i.includes("shore")) {
			return {team: NCAA_TEAMS["mdes"]};
		}
		return {team: NCAA_TEAMS["md"]};
	} else if(i.includes("mass")) {
		if(i.includes("low")) {
			return {team: NCAA_TEAMS["umassl"]};
		}
		return {team: NCAA_TEAMS["mass"]};
	} else if(i.includes("mcneese")) {
		return {team: NCAA_TEAMS["mcn"]};
	} else if(i.includes("memphis")) {
		return {team: NCAA_TEAMS["mem"]};
	} else if(i.includes("mercer")) {
		return {team: NCAA_TEAMS["mer"]};
	} else if(i.includes("michigan")) {
		if(i.includes("state")) {
			return {team: NCAA_TEAMS["mist"]};
		} else if(i.includes("west")) {
			return {team: NCAA_TEAMS["wmi"]};
		} else if(i.includes("central")) {
			return {team: NCAA_TEAMS["cenm"]};
		} else if(i.includes("east")) {
			return {team: NCAA_TEAMS["em"]};
		}
		return {team: NCAA_TEAMS["mi"]};
	} else if(i.includes("middle")) {
		return {team: NCAA_TEAMS["midtenn"]};
	} else if(i.includes("milwaukee")) {
		return {team: NCAA_TEAMS["mil"]};
	} else if(i.includes("minnesota")) {
		return {team: NCAA_TEAMS["minn"]};
	} else if(i.includes("miss") && (i.includes("ole") || i.includes("old"))) {
		return {team: NCAA_TEAMS["ms"]};
	} else if(i.includes("mississippi")) {
		if(i.includes("state")) {
			if(i.includes("valley")) {
				return {team: NCAA_TEAMS["missv"]};
			}
			return {team: NCAA_TEAMS["msst"]};
		} else if(i.includes("valley")) {
			return {team: NCAA_TEAMS["missv"]};
		}
		return {team: NCAA_TEAMS["ms"]};
	} else if(i.includes("missouri")) {
		if(i.includes("kansas")) {
			return {team: NCAA_TEAMS["umkc"]};
		} else if(i.includes("state")) {
			return {team: NCAA_TEAMS["most"]};
		}	
		return {team: NCAA_TEAMS["mo"]};
	} else if(i.includes("miss") && i.includes("valley")) {
		return {team: NCAA_TEAMS["missv"]};
	} else if(i.includes("monmouth")) {
		return {team: NCAA_TEAMS["mon"]};	
	} else if(i.includes("montana")) {
		if(i.includes("state")) {
			return {team: NCAA_TEAMS["montst"]};
		}
		return {team: NCAA_TEAMS["mont"]};
	} else if(i.includes("more") && i.includes("state") && i.includes("head")) {
		return {team: NCAA_TEAMS["more"]};
	} else if(i.includes("morgan") && i.includes("state")) {
		return {team: NCAA_TEAMS["nirg"]};
	} else if(i.includes("mount")) {
		if(i.includes("mary")) {
			return {team: NCAA_TEAMS["loym"]};
		} else if(i.includes("saint") || i.includes("mary")) {
			return {team: NCAA_TEAMS["msm"]};
		} else {
			console.log("Couldn't find mount team", i);
			return null; // todo
		}
	} else if(i.includes("murray") && i.includes("state")) {
		return {team: NCAA_TEAMS["murst"]};	
	} else if(i.includes("navy")) {
		return {team: NCAA_TEAMS["navy"]};
	} else if(i.includes("nebraska")) {
		return {team: NCAA_TEAMS["neb"]};
	} else if(i.includes("nevada")) {
		return {team: NCAA_TEAMS["nev"]};
	} else if(i.includes("orleans")) {
		return {team: NCAA_TEAMS["no"]};
	} else if(i.includes("hampshire")) {
		return {team: NCAA_TEAMS["nh"]};	
	} else if(i.includes("mexico")) {
		if(i.includes("state")) {
			return {team: NCAA_TEAMS["nmst"]};
		}
		return {team: NCAA_TEAMS["nm"]};
	} else if(i.includes("niagara")) {
		return {team: NCAA_TEAMS["nia"]};
	} else if((i.includes("nichol") || i.includes("nicole")) && i.includes("state")) {
		return {team: NCAA_TEAMS["nichst"]};
	} else if(i.includes("norfolk") && i.includes("state")) {
		return {team: NCAA_TEAMS["norfst"]};
	} else if(i.includes("njit") || i.includes("n. j. i. t.") || (i.includes("new") && i.includes("jersey"))) {
		return {team: NCAA_TEAMS["njit"]};
	} else if(i.includes("nccu") || i.includes("n. c. c. u.")) {
		return {team: NCAA_TEAMS["nccu"]};
	} else if((i.includes("nc ") || i.includes("n. c.")) && i.includes("state")) {
		return {team: NCAA_TEAMS["ncst"]};
	} else if(i.includes("niu") || i.includes("n. i. u.")) {
		return {team: NCAA_TEAMS["niu"]};
	} else if(i.includes("north") && i.includes("east")) {
		return {team: NCAA_TEAMS["ne"]};
	} else if(i.includes("north") && i.includes("west")) {
		if(i.includes("state")) {
			return {team: NCAA_TEAMS["nwst"]};
		}
		return {team: NCAA_TEAMS["nw"]};
	} else if(i.includes("notre") || i.includes("dame")) {
		return {team: NCAA_TEAMS["nd"]};
	} else if(i.includes("ohio")) {
		if(i.includes("state")) {
			return {team: NCAA_TEAMS["ohst"]};
		} else if(i.includes("miami")) {
			return {team: NCAA_TEAMS["miaoh"]};
		}
		return {team: NCAA_TEAMS["oh"]};
	} else if(i.includes("oklahoma")) {
		if(i.includes("state")) {
			return {team: NCAA_TEAMS["okst"]};
		}
		return {team: NCAA_TEAMS["ok"], exactMatch: false};
	} else if(i.includes("oak") && i.includes("land")) {
		return {team: NCAA_TEAMS["oak"]};
	} else if(i.includes("oak") && i.includes("state")) {
		return {team: NCAA_TEAMS["okst"]};
	} else if(i.includes("dominion")) {
		return {team: NCAA_TEAMS["od"]};
	} else if(i.includes("omaha")) {
		return {team: NCAA_TEAMS["oma"]};
	} else if(i.includes("oral")) {
		return {team: NCAA_TEAMS["ora"]};
	} else if(i.includes("oregon")) {
		if(i.includes("state")) {
			return {team: NCAA_TEAMS["orst"]};
		}
		return {team: NCAA_TEAMS["or"]};
	} else if(i.includes("pacific")) {
		return {team: NCAA_TEAMS["pac"]};
	} else if(i.includes("pen") && i.includes("state")) {
		return {team: NCAA_TEAMS["ps"]};
	} else if(i.includes("pepper")) {
		return {team: NCAA_TEAMS["pep"]};
	} else if(i.includes("pit")) {
		return {team: NCAA_TEAMS["pit"]};
	} else if(i.includes("portland")) {
		 if(i.includes("state")) {
			return {team: NCAA_TEAMS["porst"]};
		}
		return {team: NCAA_TEAMS["por"]};
	} else if(i.includes("prairie")) {
		return {team: NCAA_TEAMS["prvam"]};
	} else if(i.includes("presbyterian")) {
		return {team: NCAA_TEAMS["pres"]};
	} else if(i.includes("princeton")) {
		return {team: NCAA_TEAMS["pri"]};	
	} else if(i.includes("providence")) {
		return {team: NCAA_TEAMS["pro"]};
	} else if(i.includes("purdue")) {
		return {team: NCAA_TEAMS["pur"]};
	} else if(i.includes("quinn")) {
		return {team: NCAA_TEAMS["qui"]};
	} else if(i.includes("radford")) {
		return {team: NCAA_TEAMS["rad"]};
	} else if(i.includes("rhode") && i.includes("island")) {
		return {team: NCAA_TEAMS["rho"]};
	} else if(i.includes("rice")) {
		return {team: NCAA_TEAMS["rice"]};
	} else if(i.includes("richmond")) {
		return {team: NCAA_TEAMS["rich"]};
	} else if(i.includes("rider")) {
		return {team: NCAA_TEAMS["rid"]};
	} else if(i.includes("robert") && i.includes("morris")) {
		return {team: NCAA_TEAMS["rm"]};
	} else if(i.includes("rutgers")) {
		return {team: NCAA_TEAMS["rut"]};
	} else if(i.includes("sacramento") && i.includes("state")) {
		return {team: NCAA_TEAMS["sacst"]};
	} else if(i.includes("sacred") && i.includes("heart")) {
		return {team: NCAA_TEAMS["sach"]};
	} else if(i.includes("diego")) {
		if(i.includes("state")) {
			return {team: NCAA_TEAMS["sdst"]};
		}
		return {team: NCAA_TEAMS["sd"]};
	} else if(i.includes("jose")) { // todo test
		return {team: NCAA_TEAMS["sjst"]};
	} else if(i.includes("samford")) {
		return {team: NCAA_TEAMS["samf"]};
	} else if(i.includes("savanna") && i.includes("state")) {
		return {team: NCAA_TEAMS["sav"]};
	} else if(i.includes("smu") || i.includes("s. m. u.") || i.includes("methodist")) {
		return {team: NCAA_TEAMS["smu"]};
	} else if(i.includes("miss") && i.includes("south")) {
		return {team: NCAA_TEAMS["smi"]};
	} else if(i.includes("saint")) {
		if(i.includes("bon") || i.includes("adventure") || i.includes("bonaventure")) {
			return {team: NCAA_TEAMS["stb"]};
		} else if(i.includes("francisco")) {
			return {team: NCAA_TEAMS["sanf"], exactMatch: false};
		} else if(i.includes("john") || i.includes("jon")) {
			return {team: NCAA_TEAMS["stj"]};
		} else if(i.includes("joseph") || i.includes("joe")) {
			return {team: NCAA_TEAMS["stjoe"]};
		} else if(i.includes("louis")) {
			return {team: NCAA_TEAMS["stl"]};
		} else if(i.includes("mary")) {
			return {team: NCAA_TEAMS["stm"]};
		} else if(i.includes("francis") && i.includes("brooklyn")) {
			return {team: NCAA_TEAMS["stf"]};
		} else if(i.includes("francis") && (i.includes("pa") || i.includes("p. a.") || i.includes("pennsylvania"))) {
			return {team: NCAA_TEAMS["stfpa"]};
		} else if(i.includes("clara")) {
			return {team: NCAA_TEAMS["sant"], exactMatch: false};
		} else {
			console.log("Couldn't find saint team", i);
			return null; // todo
		}
	} else if(i.includes("francisco")) {
		return {team: NCAA_TEAMS["sanf"]};
	} else if(i.includes("clara")) {
		return {team: NCAA_TEAMS["sant"]};
	} else if(i.includes("seattle")) {
		return {team: NCAA_TEAMS["sea"]};
	} else if(i.includes("seton") || i.includes("seedin")) {
		return {team: NCAA_TEAMS["set"]};
	} else if(i.includes("siena")) {
		return {team: NCAA_TEAMS["sie"]};
	} else if(i.includes("siu") || i.includes("edwards")) {
		return {team: NCAA_TEAMS["siu"]};
	} else if(i.includes("stanford")) {
		return {team: NCAA_TEAMS["sta"]};
	} else if(i.includes("stetson")) {
		return {team: NCAA_TEAMS["stet"]};	
	} else if(i.includes("stony") && i.includes("brook")) {
		return {team: NCAA_TEAMS["sb"]};	
	} else if(i.includes("syracuse")) {
		return {team: NCAA_TEAMS["syr"]};
	} else if(i.includes("tcu") || i.includes("t. c. u.")) {
		return {team: NCAA_TEAMS["tcu"]};
	} else if(i.includes("tennessee")) {
		if(i.includes("east")) {
			return {team: NCAA_TEAMS["eten"]};
		} else if(i.includes("martin")) {
			return {team: NCAA_TEAMS["tenmart"]};
		} else if(i.includes("state")) {
			return {team: NCAA_TEAMS["tenst"]};
		} else if(i.includes("tech")) {
			return {team: NCAA_TEAMS["tentc"]};
		}
		return {team: NCAA_TEAMS["ten"]};
	} else if(i.includes("temple")) {
		return {team: NCAA_TEAMS["tem"]};
	} else if(i.includes("texas")) { 
		if(i.includes("a and m")) { // todo test
			if(i.includes("corp") || i.includes("christ")) {
				return {team: NCAA_TEAMS["texamcc"]};
			}
			return {team: NCAA_TEAMS["texam"]};
		} else if(i.includes("state")) {
			return {team: NCAA_TEAMS["texst"]};
		} else if(i.includes("tech")) {
			return {team: NCAA_TEAMS["textc"]};
		} else if(i.includes("north")) {
			return {team: NCAA_TEAMS["nt"]};
		} else if(i.includes("arlington")) {
			return {team: NCAA_TEAMS["texar"]};
		} else if(i.includes("rio") || i.includes("rgv")) {
			return {team: NCAA_TEAMS["utrgv"]};
		} else if(i.includes("south")) {
			return {team: NCAA_TEAMS["texs"]};
		} else {
			return {team: NCAA_TEAMS["tex"]};
		}
	} else if(i.includes("toledo")) {
		return {team: NCAA_TEAMS["tol"]};
	} else if(i.includes("towson")) {
		return {team: NCAA_TEAMS["tow"]};
	} else if(i.includes("troy")) {
		return {team: NCAA_TEAMS["troy"]};
	} else if(i.includes("tulane")) {
		return {team: NCAA_TEAMS["tula"]};
	} else if(i.includes("tulsa")) {
		return {team: NCAA_TEAMS["tuls"]};
	} else if(i.includes("uab") || i.includes("u. a. b.") || i.includes("birmingham")) {
		return {team: NCAA_TEAMS["uab"]};
	} else if(i.includes("riverside")) {
		return {team: NCAA_TEAMS["ucr"]};
	} else if(i.includes("irvine")) {
		return {team: NCAA_TEAMS["uci"]};
	} else if(i.includes("barbara")) {
		return {team: NCAA_TEAMS["ucb"]};
	} else if(i.includes("asheville")) {
		return {team: NCAA_TEAMS["unca"]};
	} else if(i.includes("greens")) {
		return {team: NCAA_TEAMS["uncg"]};
	} else if(i.includes("wilmington")) {
		return {team: NCAA_TEAMS["uncw"]};
	} else if(i.includes("davis")) {
		return {team: NCAA_TEAMS["ucda"]};
	} else if(i.includes("ucf") || i.includes("u. c. f.")) {
		return {team: NCAA_TEAMS["ucf"]};
	} else if(i.includes("ucla") || i.includes("u. c. l. a.") || i.includes("angeles")) {
		return {team: NCAA_TEAMS["ucla"]};
	} else if(i.includes("uic")) {
		return {team: NCAA_TEAMS["uic"]};
	} else if(i.includes("umbc") || (i.includes("baltimore") && i.includes("maryland"))) {
		return {team: NCAA_TEAMS["umbc"]};
	} else if(i.includes("umkc")) {
		return {team: NCAA_TEAMS["umkc"]};
	} else if(i.includes("unlv") || i.includes("u. n. l. v.") || i.includes("vegas")) {
		return {team: NCAA_TEAMS["unlv"]};
	} else if(i.includes("usc") || i.includes("u. s. c.") || (i.includes("south") && i.includes("california"))) {
		return {team: NCAA_TEAMS["usc"]};
	} else if(i.includes("ut martin")) {
		return {team: NCAA_TEAMS["tenmart"]};
	} else if(i.includes("utah")) {
		if(i.includes("state")) {
			return {team: NCAA_TEAMS["utst"]};
		} else if(i.includes("valley")) {
			return {team: NCAA_TEAMS["utv"]};
		} else if(i.includes("south")) {
			return {team: NCAA_TEAMS["suta"]};
		}
		return {team: NCAA_TEAMS["utah"]};
	} else if(i.includes("utep") || i.includes("u. t. e. p.") || i.includes("paso")) {
		return {team: NCAA_TEAMS["utep"]};
	} else if(i.includes("utrgv") || i.includes("u. t. r. g. v.")) {
		return {team: NCAA_TEAMS["utrgv"]};
	} else if(i.includes("utsa") || i.includes("u. t. s. a.") || i.includes("antonio")) {
		return {team: NCAA_TEAMS["utsa"]};
	} else if(i.includes("valparaiso") || i.includes("valparaíso")) {
		return {team: NCAA_TEAMS["valp"]};
	} else if(i.includes("vanderbilt")) {
		return {team: NCAA_TEAMS["van"]};
	} else if(i.includes("vcu") || i.includes("v. c. u.")) {
		return {team: NCAA_TEAMS["vcu"]};
	} else if(i.includes("vermont")) {
		return {team: NCAA_TEAMS["ver"]};
	} else if(i.includes("villa") && i.includes("nova")) {
		return {team: NCAA_TEAMS["vil"]};
	} else if(i.includes("virginia")) {
		if(i.includes("west")) {
			return {team: NCAA_TEAMS["wv"]};
		} else if(i.includes("tech")) {
			return {team: NCAA_TEAMS["vatech"]};
		} else if(i.includes("common") || i.includes("wealth")) {
			return {team: NCAA_TEAMS["vcu"]};
		} else if(i.includes("military")) {
			return {team: NCAA_TEAMS["vmi"]};
		}
		return {team: NCAA_TEAMS["va"]};
	} else if(i.includes("vmi")) {
		return {team: NCAA_TEAMS["vmi"]};
	} else if(i.includes("wvu")) {
		return {team: NCAA_TEAMS["wv"]};
	} else if(i.includes("wagner")) {
		return {team: NCAA_TEAMS["wagner"]};
	} else if(i.includes("wake") || i.includes("forest")) {
		return {team: NCAA_TEAMS["wake"]};
	} else if(i.includes("washington")) {
		if(i.includes("state")) {
			return {team: NCAA_TEAMS["wasst"]};
		}
		return {team: NCAA_TEAMS["was"]};
	} else if(i.includes("web") && i.includes("state")) {
		return {team: NCAA_TEAMS["web"]};
	} else if(i.includes("wichita")) {
		return {team: NCAA_TEAMS["wic"]};
	} else if(i.includes("william") && i.includes("mary")) {
		return {team: NCAA_TEAMS["wandm"]};
	} else if(i.includes("winthrop")) {
		return {team: NCAA_TEAMS["win"]};
	} else if(i.includes("wofford")) {
		return {team: NCAA_TEAMS["wof"]};
	} else if(i.includes("wisconsin")) {
		return {team: NCAA_TEAMS["wis"]};
	} else if(i.includes("state") && i.includes("right")) {
		return {team: NCAA_TEAMS["wrs"]};
	} else if(i.includes("wyoming")) {
		return {team: NCAA_TEAMS["wy"]};
	} else if(i.includes("xavier")) {
		return {team: NCAA_TEAMS["xav"]};
	} else if(i.includes("yale")) {
		return {team: NCAA_TEAMS["yale"]};	
	}  else if(i.includes("young") && i.includes("state")) {
		return {team: NCAA_TEAMS["ys"]};
	}



	 else if(i.includes("pen")) {
		return {team: NCAA_TEAMS["penn"]};
	} else if((i.includes("sc ") || i.includes("s. c. ")) && i.includes("state")) {
		return {team: NCAA_TEAMS["scst"]};
	} else if(i.includes("southern")) {
		return {team: NCAA_TEAMS["south"]}; // todo test
	}

	else {
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
	} else if(i.includes("atlanta") || i.includes("that lana")) {
		return {team: NBA_TEAMS["atl"], exactMatch: false};
	} else if(i.includes("celtics")) {
		return {team: NBA_TEAMS["bos"], exactMatch: true};
	} else if(i.includes("boston")) {
		return {team: NBA_TEAMS["bos"], exactMatch: false};
	} else if(i.includes("charlotte")) {
		return {team: NBA_TEAMS["cha"], exactMatch: false};
	} else if(i.includes("hornets")) {
		return {team: NBA_TEAMS["cha"], exactMatch: true};
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
		return {team: NBA_TEAMS["gs"], exactMatch: true}; // todo not exact match when raiders move, or if NHL implemented
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
	} else if(i.includes("oklahoma") && i.includes("city")) {
		return {team: NBA_TEAMS["okc"], exactMatch: true};
	} else if(i.includes("magic")) {
		return {team: NBA_TEAMS["orl"], exactMatch: true};
	} else if(i.includes("orlando")) {
		return {team: NBA_TEAMS["orl"], exactMatch: true};
	} else if(i.includes("seventy") || i.includes("sixers")) {
		return {team: NBA_TEAMS["phi"], exactMatch: true};
	} else if(i.includes("philadelphia") || i.includes("philly")) {
		return {team: NBA_TEAMS["phi"], exactMatch: false};
	} else if(i.includes("suns")) {
		return {team: NBA_TEAMS["pho"], exactMatch: true};
	} else if(i.includes("phoenix")) {
		return {team: NBA_TEAMS["pho"], exactMatch: true};
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
		return {team: NBA_TEAMS["tor"], exactMatch: true}; // todo not exact match when NHL implemented
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
	} else if(i.includes("atlanta") || i.includes("that lana")) {
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
	} else if(i.includes("bengals") || i.includes("bangles")) {
		return {team: NFL_TEAMS["cin"], exactMatch: true};
	} else if(i.includes("cincinnati")) {
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
	} else if(i.includes("texans")) {
		return {team: NFL_TEAMS["hou"], exactMatch: true};
	} else if(i.includes("houston")) {
		return {team: NFL_TEAMS["hou"], exactMatch: false};
	} else if(i.includes("colts")) {
		return {team: NFL_TEAMS["ind"], exactMatch: true};
	} else if(i.includes("indianapolis")) {
		return {team: NFL_TEAMS["ind"], exactMatch: true};
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
	} else if(i.includes("new") && i.includes("england")) {
		return {team: NFL_TEAMS["ne"], exactMatch: true};
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
	} else if(i.includes("forty niner") || (i.includes("40") && i.includes("nine"))) {
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
		return {team: NFL_TEAMS["tb"], exactMatch: true}; // todo not exact match if NHL
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

