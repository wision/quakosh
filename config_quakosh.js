module.exports = {
	start: new Date(),
	clients: {
		irc: null,
		discord: null,
		send: null,
	},
	irc: {
		// #qw.cz #quake.cz #ibh
		server: "irc.quakenet.org",
		nickname: "Quakosh",
		auth: {
			name: process.env.QUAKOSH_IRC_AUTH_NAME,
			pass: process.env.QUAKOSH_IRC_AUTH_PASS,
		},
		channels: [
			
		],
		updateUsers: 60 * 1000,
		updateName: 60 * 1000,
		colors: ["02", "03", "04", "05", "06", "07", "09", "10", "11", "12", "13"],
	},
	discord: {
		token: 'NjUyMDg0MjI4MjM3OTUwOTc2.XejUPw.rODvwF7Vq56pClsyQz89w56Wklo',
		guildId: '288985933204946946',
		channels: [
			{
				name: "general",
				type: "discord",
			},
		]
	},
	proxy: {
		channels: {
		},
	},
	modules: [
		"proxy", // proxy has to be first
		"quakosh",
	],
}
