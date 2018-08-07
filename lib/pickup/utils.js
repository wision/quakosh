const config = require(`./../../${process.env.CONFIG}`)


// get all the modes for given channel and update the topic
const updateChannelTopic = (channel, teams) => {
	if (config.pickup.channels[channel].type === "irc") {
		let modes = []
		for (let mode of config.pickup.channels[channel].pickup.modes) {
			modes.push(`\x0312${mode}\x0F [${teams[mode].length}/${config.pickup.modes[mode].limit}]`)
		}
		config.clients.irc.client.conn.write(`TOPIC ${channel} :\x0305[\x0F ${modes.join(" :: ")} \x0305]\x0F\n`)
	} else if (config.pickup.channels[channel].type === "discord") {
		let discordChannel = config.clients.discord.client.channels.find("name", channel)

		if (discordChannel) {
			let modes = []
			for (let mode of config.pickup.channels[channel].pickup.modes) {
				modes.push(`**${mode}** [${teams[mode].length}/${config.pickup.modes[mode].limit}]`)
			}

			discordChannel.send(`changed the topic of ${channel} to: ${modes.join(" :: ")}`)
			discordChannel.setTopic(`[ ${modes.join(" :: ")} ]`)
		}
	}
}

module.exports = {
	updateChannelTopic: updateChannelTopic,
}
