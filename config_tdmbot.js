module.exports = {
	start: new Date(),
	clients: {
		irc: null,
		discord: null,
		send: null,
	},
	xirc: {
		server: "irc.quakenet.org",
		nickname: "TDMBot_test",
		auth: {
			name: process.env.TDMBOT_IRC_AUTH_NAME,
			pass: process.env.TDMBOT_IRC_AUTH_PASS,
		},
		channels: [/*
			{
				name: "#tdmpickup.fff",
				type: "irc",
				pickup: {
					default: "qltdm",
					modes: ["qltdm", "ql2v2"],
				},
				proxy: [
					{
						name: "ql-tdmpickup",
						type: "discord",
					},
				],
			},*/
		],
		updateUsers: 60 * 1000,
		updateName: 60 * 1000,
		colors: ["02", "03", "04", "05", "06", "07", "09", "10", "11", "12", "13"],
	},
	discord: {
		token: process.env.TDMBOT_DISCORD_TOKEN,
		channels: [/*
			{
				name: "dev",
				type: "discord",
				proxy: [
					{
						name: "#tdmpickup.fff",
						type: "irc",
					},
				],
				pickup: {
					default: "qltdm",
					modes: ["qltdm", "ql2v2"],
				},
			},*/
			{
				name: "pickup",
				type: "discord",
				pickup: {
					default: "q2tdm",
					modes: ["q2tdm", "q22v2", "qctdm", "qcsac"],
				},
			},
			{
				name: "qc-tdmpickup",
				type: "discord",
				proxy: [],
				pickup: {
					default: "qctdm",
					modes: ["qctdm", "qc2v2"],
				},
			},
			{
				name: "qc-sacpickup",
				type: "discord",
				proxy: [],
				pickup: {
					default: "qcsac",
					modes: ["qcsac"],
				},
			},
			{
				name: "ql-tdmpickup",
				type: "discord",
				proxy: [
					{
						name: "#tdmpickup.fff",
						type: "irc",
					},
				],
				pickup: {
					default: "qltdm",
					modes: ["qltdm", "ql2v2"],
				},
			},
			{
				name: "ql-ctfpickup",
				type: "discord",
				proxy: [],
				pickup: {
					default: "qlctf",
					modes: ["qlctf", "qlctf5"],
				},
			},
		]
	},
	proxy: {
		channels: {
		},
	},
	pickup: {
		// list of all available modes with mode configuration
		modes: {
			qctdm: {
				name: "QC TDM 4v4",
				maps: ["Blood Covenant", "Ruins of Sarnath", "Burial Chamber", "Lockbox"],
				limit: 8,
				channels: [],
				type: 'captains',
			},
			qc2v2: {
				name: "QC TDM 2v2",
				maps: ["Blood Covenant", "Ruins of Sarnath", "Burial Chamber", "Lockbox"],
				limit: 4,
				channels: [],
				type: 'random',
			},
			qcsac: {
				name: "QC Sac 4v4",
				maps: ["Blood Covenant", "Ruins of Sarnath", "Burial Chamber", "Lockbox"],
				limit: 8,
				channels: [],
				type: 'captains',
			},
			ql2v2: {
				name: "QL TDM 2v2",
				maps: ["Almost Lost", "Bloodrun", "Campgrounds", "Devilish", "Hidden Fortress"],
				limit: 4,
				channels: [],
				type: 'random',
			},
			qltdm: {
				name: "QL TDM 4v4",
				maps: ["Campgrounds", "Deep Inside", "Dreadful Place", "Grim Dungeons", "Hidden Fortress", "Intervention", "Limbus", "Purgatory", "Ragnarok", "Tornado"],
				limit: 8,
				channels: [],
				type: 'steamid',
			},
			qlctf: {
				name: "QL CTF 4v4",
				maps: ["Spider Crossings", "Japanese Castles", "Troubled Waters", "Shining Forces", "Infinity", "Ironworks", "Pillbox", "Siberia", "Dukes Garden", "Electrocution"],
				limit: 8,
				channels: [],
				type: 'steamid',
			},
			qlctf5: {
				name: "QL CTF 5v5",
				maps: ["Spider Crossings", "Japanese Castles", "Troubled Waters", "Shining Forces", "Infinity", "Ironworks", "Pillbox", "Siberia", "Dukes Garden", "Electrocution"],
				limit: 10,
				channels: [],
				type: 'steamid',
			},
			q22v2: {
				name: "Q2 TDM 2v2",
				maps: ["The Edge", "Frag Pipe"],
				limit: 4,
				channels: [],
				type: 'random',
			},
			q2tdm: {
				name: "Q2 TDM 4v4",
				maps: ["The Edge", "Frag Pipe"],
				limit: 8,
				channels: [],
				type: 'captains',
			},
		},
		// last games for each mod
		last: {},
	},
	modules: [
		"proxy", // proxy has to be first
		//"quakosh",
		"pickup",
	],
}
