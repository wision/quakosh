require('dotenv').config()
if (!process.env.CONFIG) {
	process.env.CONFIG = process.argv[2]
}
const bot = require("./lib/bot")
bot.run()
return

const sqlite3 = require("sqlite3").verbose()
let db = new sqlite3.Database("./lib/pickup/tdmbot.db");
db.get("SELECT * FROM steam_id_map WHERE data_type = 1 AND data = 'wision';", (err, row) => {
	console.log(err, row)
})
return

let ids = [
	"76561198257306259",
	"76561198171861028",
	"76561198013811463",
	"76561197963368409",
	"76561197972822622",
	"76561198241548446",
	"76561198257561075",
	"76561198196618515",
]
const utils = require("./lib/utils")
utils.doRequest("GET", "qlstats.net", `/elo/${ids.join("+")}`, (err, data) => {
	console.log(err, data)
})
return




const moment = require("moment")
text = "$iif($time(HH) < 4, Bonsoir, $iif($time(HH) < 12, Bon matin, $iif($time(HH) < 18, Bonjour, Bonsoir))))"
text = "$calc(2017 - 1981 + ($ctime - $ctime(23.5.$date(yy))) / 86400/(365+$iif(4 // $date(yy),1)))"

text = "$calc($date(yyyy)-1981+($ctime -$ctime(23.5.$date(yy)))/86400/(365+$iif(4 // $date(yy),1)))"

while (text.indexOf("$iif(4 // $date(yy),1)") > -1) {
	//text = text.replace("$iif(4 // $date(yy),1)", )
}
const now = new Date()
while (text.indexOf("$date(") > -1) {
	text = text.replace("$date(yy)", now.getFullYear())
	text = text.replace("$date(yyyy)", now.getFullYear())
}
text = text.replace("$date", now.toDateString())
while (text.indexOf("$ctime(") > -1) {
	text = text.replace(/\$ctime\(([^(^)]*)\)/, (match, date) => {
		date = date.split(".").reverse().join("-")
		console.log(new Date(date))
		return ""
	})
	break
}
console.log(text)
