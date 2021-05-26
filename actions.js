const lodash = require('lodash')
const Client = require('node-rest-client').Client

module.exports = {
	initActions() {
		const actions = {}
		this.actionKeyToPath = {}

		// Parse ROUTES.json to generate actions dynamically.
		const parseRoutes = (obj, path = []) => {
			function isRouteConfig(obj) {
				return obj.hasOwnProperty('commands') && lodash.isArray(obj.commands)
			}

			for (const key of Object.keys(obj)) {
				const path_ = path.concat([key])
				const childObj = obj[key]
				if (!lodash.isObject(childObj)) return

				if (isRouteConfig(childObj)) {
					let { commands, tooltip = '', predefines = {}, groups = [] } = childObj

					// get number of params
					const match = commands[0].match(/n\[\d+\]/g)
					const paramCount = match ? match.length : 0

					const actionKey = path_.join('/')
					// Add null predefine if predefines is empty
					if (lodash.isEmpty(predefines)) predefines[''] = []

					for (const [predefineName, predefineParams] of Object.entries(predefines)) {
						const predefineKey = actionKey + ' ' + predefineName
						const label = path_.join(' ') + ' ' + predefineName

						const options = []
						for (let i = 0; i < paramCount; i++) {
							options.push({
								type: 'textinput',
								label: `Param ${i}`,
								id: `param${i}`,
								regex: this.REGEX_SOMETHING,
								default: predefineParams[i],
							})
						}

						actions[predefineKey] = {
							actionKey: actionKey,
							label: label,
							options: options,
							func: new Function('n', 'return ' + commands[0]),
							tooltip: tooltip,
							groups: groups,
							predefineName: predefineName,
						}

						this.actionKeyToPath[predefineKey] = path_
						if (commands[0].includes('TOGGLES: ')) {
							actions[predefineKey].toggles = actions[predefineKey].func().TOGGLES
						}
					}
				} else {
					parseRoutes(childObj, path_)
				}
			}
		}
		parseRoutes(this.routes)

		this.actions = actions
		this.setActions(actions)
	},
	action(action) {
		const key = action.action
		const path = this.actionKeyToPath[key]
		if (lodash.isEmpty(path)) {
			this.log('warn', 'Corresponding action for key "' + key + '" could not be found.')
			return
		}

		const params = Object.entries(action.options || {})
			.sort(([k0, v0], [k1, v1]) => k0 - k1)
			.map(([k, v]) => v || 0)
			.map(encodeURIComponent)

		let url = this.config.url
		if (!url.endsWith('/')) url = url + '/'
		url = url + path.concat(params).join('/')
		new Client()
			.get(url, (data, response) => {
				const successful = 200 <= response.statusCode && response.statusCode < 300
				this.status(successful ? this.STATUS_OK : this.STATUS_ERROR)
				try {
					this.lastAction = {
						key: action.action,
						browserConfig: JSON.parse(data.toString()),
						successful: successful,
					}
				} catch (error) {
					this.lastAction = {
						key: action.action,
						browserConfig: {},
						successful: false,
					}
				}
				this.checkAllFeedbacks()
			})
			.on('error', (error) => {
				this.status(this.STATUS_ERROR, response.statusCode.code)
				this.lastAction = {
					key: action.action,
					browserConfig: {},
					successful: false,
				}
				this.checkAllFeedbacks()
			})
	},
}
