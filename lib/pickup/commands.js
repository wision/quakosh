const async = require("async")
const moment = require("moment")
const utils = require("./../utils")
const pickupUtils = require("./utils")

// display fromNow() in hours at most
moment.relativeTimeThreshold('h', 24 * 999999);

module.exports = (config, db) => {
	const _getModeWho = (mode, teams) => {
		let players = teams[mode].map((player) => {
			return player.name
		})
		let msg = `${config.pickup.modes[mode].name} [${teams[mode].length}/${config.pickup.modes[mode].limit}] ${players.join(", ")}`
		if (!teams[mode].length) {
			msg = null
		}
		return msg
	}

	const who = (client, teams, from, to, mode) => {
		let msg = ""

		if (mode) {
			if (teams[mode].length) {
				msg = _getModeWho(mode, teams)
			}
		} else {
			let msgs = []
			for (let mode of config.pickup.channels[to].pickup.modes) {
				if (teams[mode].length) {
					msgs.push(_getModeWho(mode, teams))
				}
			}
			msg = msgs.join(" :: ")
		}
		if (!msg.length) {
			msg = "Nobody is added."
		}

		client.send(to, msg)
	}

	const help = (client, teams, from, to) => {
		client.send(to, `Available commands: ${Object.keys(config.pickup.commands).join(", ")}`)
	}

	const modes = (client, teams, from, to) => {
		let msg = `Available modes for this channel ${to}: `
		let modes = []

		for (let mode of config.pickup.channels[to].pickup.modes) {
			modes.push(`${mode}: ${config.pickup.modes[mode].name} players limit: ${config.pickup.modes[mode].limit} maps: ${config.pickup.modes[mode].maps.join(", ")}`)
		}

		client.send(to, msg + modes.join(", "))
	}

	const remove = (client, teams, from, to, mode) => {
		let update = {}
		let modes = []

		if (mode && teams[mode]) {
			modes = [mode]
		} else {
			modes = config.pickup.channels[to].pickup.modes
		}

		for (let mode of modes) {
			teams[mode] = teams[mode].filter((player) => {
				if (player.name === from) {
					for (let channel of config.pickup.modes[mode].channels) {
						update[channel.name] = true
					}
					return false
				}
				return true
			})
		}

		for (let channel in update) {
			pickupUtils.updateChannelTopic(channel, teams)
		}
	}

	// http://qlstats.net/elo/76561198196618515+76561197999166743
	/*
			host: "qlstats.net",
			path: "/elo/76561198196618515+76561197999166743",
			method: "GET",
	*/
	const _pickupReady = (client, team, from, to, mode, raw) => {
		console.log('ready', team)

		config.pickup.last[mode] = {
			date: new Date(),
			players: team,
		}

		let players = team.map((player) => {
			return player.name
		})

		if (config.pickup.modes[mode].type === "steamid") {
			let steam_ids = team.map((player) => {
				return player.steam_id
			})

			async.retry({times: 5, interval: 200}, () => {
				utils.doRequest("GET", "qlstats.net", `/elo/${steam_ids.join("+")}`, (err, data) => {
					if (err) {
						return next(err)
					}
					
					data.players = data.players.sort((a, b) => {
						return b.tdm.elo - a.tdm.elo
					})

					let player = data.players.pop()
					let team1 = [player.steam_id]
					let team1_elo = player.tdm.elo
					player = data.players.pop()
					let team2 = [player.steam_id]
					let team2_elo = player.tdm.elo

					while (player = data.players.pop()) {
						if (team1_elo > team2_elo) {
							team2_elo += player.tdm.elo
							team2.push(player.steam_id)
						} else {
							team1_elo += player.tdm.elo
							team1.push(player.steam_id)
						}
					}

					let team1_names = []
					let team2_names = []

					for (player of team) {
						if (team1.indexOf(player.steam_id) > -1) {
							team1_names.push(player.name)
						} else {
							team2_names.push(player.name)
						}
					}

					team1_elo /= 4
					team2_elo /= 4

					let mappicker = players[Math.floor(Math.random() * players.length)]
					let msg = `Red (${team1_elo}): ${team1_names.join(", ")} Blue (${team2_elo}): ${team2_names.join(", ")} Diff.: ${team1_elo - team2_elo} Map Picker: ${mappicker}`

					for (let channel of config.pickup.modes[mode].channels) {
						client.send(channel.name, msg)
					}
				})
			}, (err, result) => {
				// on error use captains only
				if (err) {
					client.send(to, "Failed to fetch ratings")

					let cap1 = team[Math.floor(Math.random() * team.length)].name
					let cap2 = null

					do {
						cap2 = team[Math.floor(Math.random() * team.length)].name
					} while (cap1 === cap2)

					let msg = `${config.pickup.modes[mode].name} is ready to start! Players: ${players.join(", ")} captains: ${cap1}, ${cap2}`

					for (let channel of config.pickup.modes[mode].channels) {
						client.send(channel.name, msg)
					}
					return
				}
			})
		// TODO
		} else if (config.pickup.modes[mode].type === "random") {
			let cap1 = team[Math.floor(Math.random() * team.length)].name
			let cap2 = null

			do {
				cap2 = team[Math.floor(Math.random() * team.length)].name
			} while (cap1 === cap2)

			let msg = `${config.pickup.modes[mode].name} is ready to start! Players: ${players.join(", ")} captains: ${cap1}, ${cap2}`

			for (let channel of config.pickup.modes[mode].channels) {
				client.send(channel.name, msg)
			}
		} else {
			let cap1 = team[Math.floor(Math.random() * team.length)].name
			let cap2 = null

			do {
				cap2 = team[Math.floor(Math.random() * team.length)].name
			} while (cap1 === cap2)

			let msg = `${config.pickup.modes[mode].name} is ready to start! Players: ${players.join(", ")} captains: ${cap1}, ${cap2}`

			for (let channel of config.pickup.modes[mode].channels) {
				client.send(channel.name, msg)
			}
		}
	}

	const add = (client, teams, from, to, modes, raw) => {
		let stop = false
		let update = {}

		if (!modes) {
			modes = [config.pickup.channels[to].pickup.default]
		} else {
			modes = modes.split(" ")
		}

		async.each(modes, (mode, next) => {
			// one of the pickups is already ready.. do not continue adding
			if (stop) {
				return next()
			}

			if (config.pickup.channels[to].pickup.modes.indexOf(mode) === -1) {
				return next()
			}

			// player is already added to given mode
			for (let player of teams[mode]) {
				if (player.name === from && from !== "wision") {
					return next()
				}	
			}

			// teams are created by ranking by from steamid
			if (config.pickup.modes[mode].type === "steamid") {
				_getSteamid(from, raw.host, (raw.author ? raw.author.id : null), (err, steam_id) => {
					if (!steam_id) {
						stop = true
						client.send(to, `You must add your Steam ID before adding to pickup: !steamid <steamid>`)
						return next()
					}
					
					for (let player of teams[mode]) {
						if (player.steam_id === steam_id) {
							client.send(to, `A player (${player.name}) with your Steam ID (${player.steam_id}) is already added to ${config.pickup.modes[mode].name}.`)
							return next()
						}
					}

					for (let channel of config.pickup.modes[mode].channels) {
						update[channel.name] = true
					}

					teams[mode].push({
						//name: from + Math.random(),
						//steam_id: steam_id + Math.random(),
						name: from,
						steam_id: steam_id,
					})

					// pickup is ready
					if (teams[mode].length === config.pickup.modes[mode].limit) {
						_pickupReady(client, teams[mode], from, to, mode)

						// remove all players from all other modes
						for (let mode in config.pickup.modes) {
							for (let player of teams[mode]) {
								remove(client, teams, player.name, to)
							}
						}

						stop = true
						teams[mode] = []
					}

					next()
				})
			// teams are created randomly or with captains
			} else {
				for (let channel of config.pickup.modes[mode].channels) {
					update[channel.name] = true
				}

				teams[mode].push({
					//name: from + Math.random(),
					name: from,
					steam_id: null,
				})

				// pickup is ready
				if (teams[mode].length === config.pickup.modes[mode].limit) {
					_pickupReady(client, teams[mode], from, to, mode)

					// remove all players from all other modes
					for (let mode in config.pickup.modes) {
						for (let player of teams[mode]) {
							remove(client, teams, player.name, to)
						}
					}

					stop = true
					teams[mode] = []
				}

				next()
			}
		}, () => {
			for (let channel in update) {
				pickupUtils.updateChannelTopic(channel, teams)
			}
		})
	}

	const last = (client, teams, from, to, mode) => {
		if (!mode) {
			mode = config.pickup.channels[to].pickup.default
		}

		if (!config.pickup.modes[mode]) {
			return
		}

		let players = teams[mode].map((player) => {
			return player.name
		})

		let msg = ""
		if (config.pickup.last[mode].date) {
			msg = `${config.pickup.modes[mode].name} last started ${moment(config.pickup.last[mode].date).fromNow()}. Players: ${config.pickup.last[mode].players.join(", ")}`
		} else {
			msg = `${config.pickup.modes[mode].name} have not been played since the start of the bot since ${moment(config.start).fromNow()}.`
		}

		client.send(to, msg)
	}

	const maps = (client, teams, from, to, mode) => {
		if (!mode) {
			mode = config.pickup.channels[to].pickup.default
		}

		if (!config.pickup.modes[mode]) {
			return
		}

		let msg = `Maps for ${config.pickup.modes[mode].name} are ${config.pickup.modes[mode].maps.join(", ")}`
		client.send(to, msg)
	}

	const promote = (client, teams, from, to, mode, raw) => {
		if (!mode) {
			mode = config.pickup.channels[to].pickup.default
		}

		if (!config.pickup.modes[mode]) {
			return
		}

		for (let player of teams[mode]) {
			if (player.name === from) {
				let msg = `${config.pickup.modes[mode].limit - teams[mode].length} more players needed for ${config.pickup.modes[mode].name}! Type !add ${mode} to play!`
				return client.send(to, msg)
			}	
		}

		let msg = `You must be added to use !promote.`
		client.sendDm(raw.author, msg)
	}

	const _getSteamid = (name, hostname, discordid, next) => {
		if (discordid) {
			return db.get("SELECT cast(steam_id as text) as steam_id FROM steam_id_map WHERE data_type = 4 AND data = ?;", [discordid], (err, row) => {
				if (!row) {
					return next()
				}
				next(null, row.steam_id)
			})
		}

		db.get("SELECT cast(steam_id as text) as steam_id FROM steam_id_map WHERE (data_type = 1 AND data = ?) OR (data_type = 2 AND data = ?);", [name, hostname], (err, row) => {
			if (row) {
				return next(null, row.steam_id)
			}
			next()
		})
	}

	const steamid = (client, teams, from, to, steam_id, raw) => {
		console.log(from, to, steam_id)
		if (!steam_id) {
			_getSteamid(from, raw.host, (raw.author ? raw.author.id : null), (err, steam_id) => {
				if (steam_id) {
					client.send(to, `Steam ID for ${from} is ${steam_id}`)
				} else {
					client.send(to, `No Steam ID known for user ${from}`)
				}
			})
		} else {
			if (isNaN(steam_id)) {
				_getSteamid(steam_id, null, steam_id, (err, steam_id) => {
					if (steam_id) {
						client.send(to, `Steam ID for ${steam_id} is ${steam_id}`)
					} else {
						client.send(to, `No Steam ID known for user ${steam_id}`)
					}
				})
			} else {
				if (client.name === "discord") {
					db.run("REPLACE INTO steam_id_map (steam_id, data_type, data) VALUES (?, 4, ?);", [steam_id, raw.author.id])
				} else if (client.name === "irc") {
					db.run("REPLACE INTO steam_id_map (steam_id, data_type, data) VALUES (?, 1, ?);", [steam_id, from])
					db.run("REPLACE INTO steam_id_map (steam_id, data_type, data) VALUES (?, 2, ?);", [steam_id, raw.host])
				}
				client.send(to, `Set Steam ID for ${from} to ${steam_id}`)
			}
		}
	}

	const uptime = (client, teams, from, to, steam_id, raw) => {
		msg = `I was started ${moment(config.start).fromNow()}.`
		client.send(to, msg)
	}

	return {
		who: who,
		help: help,
		modes: modes,
		add: add,
		remove: remove,
		last: last,
		maps: maps,
		promote: promote,
		steamid: steamid,
		uptime: uptime,
	}
}
