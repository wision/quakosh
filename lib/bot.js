const config = require(`../${process.env.CONFIG}`)
const irc = require("./irc")
const discord = require("./discord")
const async = require("async")
const Iconv = require("iconv").Iconv

process.config = config


module.exports = {
	run: () => {
		const modules = {}

		async.parallel([
			(next) => {
				discord.init((err, client) => {
					config.clients.discord = client
					config.clients.discord.name = "discord"
					next(err)
				})
			},
			(next) => {
				irc.init((err, client) => {
					config.clients.irc = client
					config.clients.irc.name = "irc"
					next(err)
				})
			},
		], (err) => {
			if (err) {
				console.log("Failed to connect")
				console.log(err)
				process.exit(1)
			}

			async.each(config.modules, (module, next) => {
				modules[module] = require(`./${module}`)(config.clients.irc, config.clients.discord, (err) => {
					console.log(`Module ${module} loaded`)
					next(err)
				})
			}, (err) => {
				if (err) {
					console.log("Failed to load module")
					console.log(err)
				}
			})
		})
	}
}
