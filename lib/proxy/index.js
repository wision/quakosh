const config = require(`./../../${process.env.CONFIG}`)


const colorizeNick = (nick) => {
	const buffer = new Buffer(nick)

	let id = 0
	for (let character of buffer) {
		id += character
	}
	return `\x03${config.irc.colors[id % config.irc.colors.length]}${nick}\x0F`
}

module.exports = (irc, discord, next) => {
	const ircSend = irc.send
	const discordSend = discord.send

	for (let type of ['irc', 'discord']) {
		if (!config[type]) {
			continue
		}

		for (let channel in config[type].channels) {
			if (config[type].channels[channel].proxy && config[type].channels[channel].proxy.length > 0) {
				config.proxy.channels[config[type].channels[channel].name] = config[type].channels[channel]
			}
		}
	}

	if (irc.enable) {
		irc.client.addListener("message", (from, to, message) => {
			if (!(config.proxy.channels[to] && config.proxy.channels[to].proxy)) {
				return
			}

			for (let id in config.proxy.channels[to].proxy) {
				let channel = config.proxy.channels[to].proxy[id]

				if (channel.type === "irc") {
					ircSend(channel.name, `<${from}> ${message}`)
				}

				if (discord.enable && channel.type === "discord") {
					discordSend(channel.name, `<${from}>: ${message}`)
				}
			}
		})
	}

	if (discord.enable) {
		discord.client.on("message", (message) => {
			if (!(config.proxy.channels[message.channel.name] && config.proxy.channels[message.channel.name].proxy)) {
				return
			}

			// do not forward own messages
			if (message.author.id === discord.client.user.id) {
				return
			}

			for (let id in config.proxy.channels[message.channel.name].proxy) {
				let channel = config.proxy.channels[message.channel.name].proxy[id]

				if (irc.enable && channel.type === "irc") {
					// replace roles mentions with actual role names
					message.content = message.content.replace(/<@&([0-9]+)>/g, (match, role) => {
						return discord.client.guilds.get(config.discord.guildId).roles.get(role).name
					})
					// replace user mentions with actual nicknames
					message.content = message.content.replace(/<@([0-9]+)>/g, (match, user) => {
						return discord.client.users.get(user).username
					})
					ircSend(channel.name, `<${colorizeNick(message.author.username)}> ${message.content}`)
				}

				if (channel.type === "discord") {
					discordSend(channel.name, `<${message.author.username}>: ${message.content}`)
				}
			}
		})
	}

	// overwrite send methods to send message to all proxied channels
	if (irc.enable && discord.enable) {
		irc.send = (channel, message) => {
			ircSend(channel, message)

			if (!(config.proxy.channels[channel] && config.proxy.channels[channel].proxy)) {
				return
			}

			for (let id in config.proxy.channels[channel].proxy) {
				let chan = config.proxy.channels[channel].proxy[id]

				if (chan.type === "irc") {
					ircSend(chan.name, message)
				}

				if (chan.type === "discord") {
					discordSend(chan.name, message)
				}
			}
		}

		discord.send = (channel, message) => {
			discordSend(channel, message)

			if (!(config.proxy.channels[channel] && config.proxy.channels[channel].proxy)) {
				return
			}

			for (let id in config.proxy.channels[channel].proxy) {
				let chan = config.proxy.channels[channel].proxy[id]

				if (chan.type === "irc") {
					ircSend(chan.name, message)
				}

				if (chan.type === "discord") {
					discordSend(chan.name, message)
				}
			}
		}
	}

	next()
}
