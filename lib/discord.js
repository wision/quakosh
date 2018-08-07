const Discord = require("discord.js")
const config = require(`../${process.env.CONFIG}`).discord


module.exports = {
	init: (next) => {
		this.client = null
		this.users = {}
		this.enable = (config && config.token !== undefined)
		this.connected = false

		if (!this.enable) {
			return next(null, this)
		}

		this.channels = config.channels.map((channel) => { return channel.name })
		this.client = new Discord.Client()
		
		this.client.on("ready", () => {
			console.log('discord ready')
			if (!this.connected) {
				this.connected = true
				next(null, this)
			}
		})

		this.client.login(config.token)

		this.send = (channel, message) => {
			let discordChannel = this.client.channels.find("name", channel)

			if (discordChannel) {
				discordChannel.send(message)
			}
		}

		this.sendDm = (user, message) => {
			user.send(message)
		}
	}
}
