const irc = require("irc")
const config = require(`../${process.env.CONFIG}`).irc


module.exports = {
	init: (next) => {
		this.client = null
		this.users = {}
		this.enable = (config && config.channels.length > 0)
		this.connected = false

		if (!this.enable) {
			return next(null, this)
		}

		this.channels = config.channels.map((channel) => { return channel.name })
		this.client = new irc.Client(
			config.server,
			config.nickname,
			{
				channels: [],
				userName: config.nickname,
				realName: config.nickname,
			}
		)

		this.client.on("error", err => {
			console.log("client.on error:", err)
		})

		this.client.on("names", (channel, users) => {
			this.users[channel] = users
		})

		this.client.on("registered", () => {
			console.log(`Connected to ${config.server} as ${config.nickname} joining channels: ${this.channels}`)
			if (config.auth.name && config.auth.pass) {
				this.client.say("Q@CServe.quakenet.org", `AUTH ${config.auth.name} ${config.auth.pass}`)
				this.client.conn.write(`MODE ${config.nickname} +x\r\n`)
			}

			setInterval(() => {
				this.client.conn.write(`NICK ${config.nickname}\r\n`)
			}, config.updateName)

			// join channel after +x with small timeout
			setTimeout(() => {
				for (let channel of this.channels) {
					this.client.conn.write(`JOIN ${channel}\r\n`)

					// update list of users once in a while
					setInterval(() => {
						this.client.conn.write(`NAMES ${channel}\r\n`)
					}, config.updateUsers)
				}

				if (!this.connected) {
					this.connected = true
					next(null, this)
				}
			}, 200)
		})

		this.send = (channel, message) => {
			this.client.say(channel, message)
		}

		this.sendDm = (user, message) => {
			this.client.say(user, message)
		}
	}
}

