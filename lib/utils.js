const http = require("http")

module.exports = {
	randomItem: (array, exclude = "") => {
		let item = null
		while ((item = array[Math.floor(Math.random() * array.length)]) === exclude) {}
		return item
	},

	doRequest: (method, host, path, next) => {
		const options = {
			host: host,
			path: path,
			method: method,
		}

		console.log(JSON.stringify(options))
		let req = http.request(options, (response) => {
			let data = ""

			response.on("data", (chunk) => {
				data += chunk
			})

			response.on("error", (err) => {
				next(err)
			})

			response.on("end", () => {
				try {
					data = JSON.parse(data)
				} catch (err) {
					console.log("Failed to parse response")
					console.log("err:", err)
					console.log("data:", data)
					return next(err)
				}
				next(null, data)
			})
		})

		req.end()
	},
}
