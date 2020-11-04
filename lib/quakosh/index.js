const fs = require("fs")
const async = require("async")
const utils = require("./../utils")
const moment = require("moment")
const config = require(`./../../${process.env.CONFIG}`)

module.exports = (irc, discord, next) => {
	let ask = []
	let quotes = {}
	let learns = {}

	const cmdWho = (client, from, to, learn) => {
		if (!learns[learn]) {
			return "Nikdo."
		} else {
			return `${learns[learn].author}`
		}
	}

	const cmdLook = (client, from, to, learn) => {
		if (!learns[learn]) {
			return "Nevim, neznam."
		} else {
			return `${learn}, ${learns[learn].text}`
		}
	}

	const replaceLearnScripts = (client, from, to, text, message) => {
		let evaluated = null
		let original = text
		let users = null

		if (!text) {
			return
		}

		if (client.name === "irc") {
			users = Object.keys(client.users[to])
		} else {
			users = client.client.users.map((user) => { return user.username })
		}

		for (let i = 2; i < 10; i++) {
			while (text.indexOf(`\$${i}`) > -1) {
				if (message[i-1]) {
					text = text.replace(`\$${i}`, `"${message[i-1]}"`)
				} else {
					text = text.replace(`\$${i}`, "undefined")
				}
			}
		}

		// replace all $randomnick variables in the string
		while (text.indexOf("$randomnick") > -1) {
			let nick = utils.randomItem(users, from)
			text = text.replace("$randomnick", nick)
		}

		text = text.replace(/\$null/g, "undefined")

		// replace mirc variable concatenator
		text = text.replace(/ \$\+ /g, "")

		// replace current user
		text = text.replace(/\$nick/g, from)

		// $rand(1,110)
		text = text.replace(/\$rand\(([0-9]+),[ ]*([0-9]+)\)/g, (match, min, max) => {
			min = parseInt(min)
			max = parseInt(max)

			if (min > max) {
				let tmp = max
				max = min
				min = tmp
			}

			return Math.floor(Math.random() * (max - min + 1)) + min
		})

		// $calc($date(yyyy)-1981+($ctime -$ctime(23.5. $+ $date(yy)))/86400/(365+$iif(4 // $date(yy),1)))
	
		// $iif(hug isin $nick, $rand(58,100), $rand(5,40))
		// $iif($2 != $null,$2,$randomnick)
		let i = 0
		while (text.indexOf("$iif") > -1) {
			if (i++ > 100) {
				return `Tak tenhle learn nerozkousnu: ${original}`
			}
			try {
				text = text.replace(/\$iif\(([^(^)^,]+),\s*([^(^)^,]+),\s*([^(^)^,]+)\)/, (match, condition, ifTrue, ifFalse) => {
					if (isNaN(ifTrue) && ifTrue.indexOf("learn_condition") === -1) {
						ifTrue = ifTrue.replace(/"/g, "")
						ifTrue = `"${ifTrue}"`
					}
					if (isNaN(ifFalse) && ifFalse.indexOf("learn_condition") === -1) {
						ifFalse = ifFalse.replace(/"/g, "")
						ifFalse = `"${ifFalse}"`
					}
					if (condition.indexOf("=") > -1) {
						condition = condition.replace("=", "==")
					}
					if (condition.indexOf("isin") > -1) {
						condition = condition.replace(/(.*) isin (.*)/, (match, look, string) => {
							return `"${string}".indexOf("${look}") > -1`
						})
					}
					// fix number comparison
					if (condition.indexOf("<==") > -1) {
						condition = condition.replace("<==", "<=")
					}

					evaluated = `${condition} ? ${ifTrue} : ${ifFalse}`
					return eval(evaluated)
				})
			} catch (err) {
				console.log("Failed to process learn", original)
				console.log("Iterated:", text)
				console.log("Evaluated:", evaluated)
				console.log("Error:", err)
				return `Tak tenhle learn nerozkousnu: ${original}`
			}
		}

		return text
	}

	const cmdLearn = (client, from, to, message) => {
		const learn = learns[message] || learns[message.replace(/ /g, '_')]
		if (!learn || learn.deleted === "1") {
			return
		}

		return replaceLearnScripts(client, from, to, learn.text, message)
	}

	const cmdQuote = (client, from, to, message) => {
		message.shift()
		if (message.length === 0) {
			let names = Object.keys(quotes)
			let name = utils.randomItem(names)
			
			client.send(to, utils.randomItem(quotes[name]))
		} else {
			let who = message.shift()

			if (!quotes[who]) {
				return `No quotes for ${who}`
			}

			if (message.length === 0) {
				return utils.randomItem(quotes[who])
			} else {
				message = message.join(" ")
				let userQuotes = quotes[who].filter((quote) => { return !(quote.indexOf(message) === -1) })
				return utils.randomItem(userQuotes)
			}
		}
	}

	const processCommand = (client, from, to, message) => {
		// ignore myself
		if (config.irc && from === config.irc.nickname) {
			return
		}

		// ignore channels not in config
		if (config.clients[client].channels.indexOf(to) === -1) {
			console.log('skipping.. invalid channel' + from + to + message)
			return
		}

		let say = null
		let messages = null

		console.log('process command', from, to, message)
		message = message.trim()
		messages = message.split(" ")
		messages[0] = messages[0].toLowerCase()

		switch (messages[0]) {
			case "look":
				messages.shift()
				say = cmdLook(config.clients[client], from, to, messages.join(" "))
				break
			case "who":
				messages.shift()
				say = cmdWho(config.clients[client], from, to, messages.join(" "))
				break
			case "quote":
				say = cmdQuote(config.clients[client], from, to, messages)
				break
			case "!ask":
				say = utils.randomItem(ask)
				break
			default:
				say = cmdLearn(config.clients[client], from, to, message)
				break
		}

		// say random thing on my mention
		if (!say && message.toLowerCase().indexOf(config.irc.nickname.toLowerCase()) > -1) {
			say = utils.randomItem(ask)
		}

		if (say) {
			config.clients[client].send(to, say)
		}
	}

	const loadAsk = (next) => {
		fs.readFile("./lib/quakosh/ask.txt", (err, data) => {
			if (err) {
				return next(err)
			}

			//data = new Iconv("CP1250", "UTF-8").convert(data).toString();
			ask = data.toString()
			ask = ask.split("\r\n")

			next()
		})
	}

	const loadQuotes = (next) => {
		fs.readFile("./lib/quakosh/quotes.txt", (err, data) => {
			if (err) {
				return next(err)
			}

			//data = new Iconv("CP1250", "UTF-8").convert(data).toString();
			data = data.toString()
			data = data.split("\r\n")

			for (let line of data) {
				let name = line.substring(line.lastIndexOf(" © ") + 3).split(" ")[0].toLowerCase()

				if (!quotes[name]) {
					quotes[name] = []
				}

				quotes[name].push(line)
			}

			next()
		})
	}

	const loadLearns = (next) => {
		fs.readFile("./lib/quakosh/learns.txt", (err, data) => {
			if (err) {
				return next(err)
			}

			data = data.toString()
			data = data.split("\r\n")

			let i = 0, j = 0, name = ""
			while (true) {
				let line = data[i]
				if (!line.length) {
					break
				}
				if (line[0] === "[") {
					name = line.substring(1, line.length - 1)
					learns[name] = {}
				} else if (line[0] === "1") {
					learns[name].text = line.substring(2)
				} else if (line[0] === "2") {
					learns[name].author = line.substring(2)
				} else {
					line = line.split("=")
					learns[name][line[0]] = line[1]
				}

				i++
			}

			next()
		})
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

	async.parallel([
		loadQuotes,
		loadLearns,
		loadAsk,
	], (err) => {
		next(err)
	})
}

