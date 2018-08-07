require('dotenv').config()
if (!process.env.CONFIG) {
	process.env.CONFIG = process.argv[2]
}
const bot = require("./lib/bot")
bot.run()
