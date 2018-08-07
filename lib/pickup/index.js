const sqlite3 = require("sqlite3").verbose()

let db = new sqlite3.Database("./lib/pickup/tdmbot.db");
let config = require(`./../../${process.env.CONFIG}`)

const commands = require("./commands")(config, db)
const pickupUtils = require("./utils")

config.pickup.commands = {
	"!w": commands.who,
	"!who": commands.who,
	"!a": commands.add,
	"!add": commands.add,
	"!r": commands.remove,
	"!remove": commands.remove,
	"!h": commands.help,
	"!help": commands.help,
	"!modes": commands.modes,
	"!l": commands.last,
	"!last": commands.last,
	"!lastgame": commands.last,
	"!maps": commands.maps,
	"!p": commands.promote,
	"!promote": commands.promote,
	"!steamid": commands.steamid,
	"!uptime": commands.uptime,
}

/* init database
db.run("CREATE TABLE IF NOT EXISTS channels (id INTEGER PRIMARY KEY AUTOINCREMENT, name VARCHAR, motd VARCHAR, rules VARCHAR);")
db.run("CREATE TABLE IF NOT EXISTS pickups (id INTEGER PRIMARY KEY AUTOINCREMENT, channel_id INTEGER, short_name VARCHAR, long_name VARCHAR, size INTEGER, gametype VARCHAR, last_game_id INTEGER, maps VARCHAR, servers VARCHAR, skill_minimum INTEGER, position TINYINT, enabled BOOLEAN, FOREIGN KEY (channel_id) REFERENCES channels(id), FOREIGN KEY (last_game_id) REFERENCES matches(id));")
db.run("CREATE TABLE IF NOT EXISTS matches (id INTEGER PRIMARY KEY AUTOINCREMENT, pickup_id INTEGER, players BLOB, map_picker VARCHAR, timestamp DATETIME, FOREIGN KEY (pickup_id) REFERENCES pickups(id));")
db.run("CREATE TABLE IF NOT EXISTS steam_id_map (steam_id INTEGER, data_type TINYINT, data VARCHAR, hits INTEGER, last_seen DATETIME);")
db.run("CREATE TABLE IF NOT EXISTS rating_cache (steam_id INTEGER, gametype VARCHAR, rating FLOAT, timestamp DATETIME, PRIMARY KEY(steam_id, gametype));")

	db.each("SELECT * FROM mrdka", function(err, row) {
		console.log(row)
	})
*/

module.exports = (irc, discord, next) => {
	config.pickup.channels = {}

	let teams = {}

	// init values
	for (let mode in config.pickup.modes) {
		teams[mode] = []
		config.pickup.last[mode] = ""
	}

	// get mode -> channels mapping
	for (let client of ["irc", "discord"]) {
		if (!config[client]) {
			continue
		}

		for (let channel in config[client].channels) {
			config.pickup.channels[config[client].channels[channel].name] = config[client].channels[channel]

			for (let mode of config[client].channels[channel].pickup.modes) {
				config.pickup.modes[mode].channels.push(config[client].channels[channel])
			}
		}
	}

	const processCommand = (client, from, to, message, raw) => {
		if (!config.pickup.channels[to]) {
			return
		}

		console.log("pickup process command", client, from, to, message)
		message = message.trim()
		message = message.split(" ")
		let command = message[0].toLowerCase()
		message.shift()

		if (config.pickup.commands[command]) {
			config.pickup.commands[command](config.clients[client], teams, from, to, message.join(" "), raw)
		}
	}

	if (irc.enable) {
		// parse raw message in order to get userinfo
		irc.client.addListener("raw", (command) => {
			if (command.command !== "PRIVMSG") {
				return
			}

			processCommand("irc", command.nick, command.args[0], command.args[1], command)
		})
	}

	if (discord.enable) {
		discord.client.on("message", (message) => {
			processCommand("discord", message.author.username, message.channel.name, message.content, message)
		})
	}

	// reset all topics
	for (let client of ["irc", "discord"]) {
		if (!config[client]) {
			continue
		}

		for (let channel of config[client].channels) {
			pickupUtils.updateChannelTopic(channel.name, teams)
		}
	}

	next()
}

