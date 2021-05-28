const lodash = require('lodash')
const Client = require('node-rest-client').Client

module.exports = {
	initActions = () => {
		const actions = {}
		this.actionIdToPath = {}

		// Parse ROUTES.json to generate actions dynamically.
		const parseRoutes = (node, cmdPath = []) => {
			// Recursively parse ROUTES.json.
			// ROUTES.json defines our actions on the client and on the server side.
			// The actions are defined in a tree like fashion.
			// The leafes of the tree define our actions. The nodes on the path to a leaf
			// define a cmd path that on the server side is used to offer the corresponding action
			// as http endpont. e.g. the http endpoint for the following command is: /image/toggle

			// "image": {
			//     "toggle": {
			//         "commands": [ ... ],
			//         "tooltip": "",
			//         "presetTemplates": { ... },
			//         "groups": [ ... ]"
			// 	   }
			// }

			function isActionConfig(obj) {
				return obj.hasOwnProperty('commands') && lodash.isArray(obj.commands)
			}

			for (const [key, childNode] of Object.entries(node)) {
				const cmdPath_ = cmdPath.concat([key])

				if (isActionConfig(childNode)) {
					let { commands, tooltip = '', presetTemplates = {}, groups = [] } = childNode

					// get number of params
					const match = commands[0].match(/n\[\d+\]/g)
					const paramCount = match ? match.length : 0

					const actionId = cmdPath_.join('/')
					// Add null predefine if presetTemplates is empty
					if (lodash.isEmpty(presetTemplates)) presetTemplates[''] = []

					for (const [presetName, presetOptions] of Object.entries(presetTemplates)) {
						const presetKey = actionId + ' ' + presetName
						const label = cmdPath_.join(' ') + ' ' + presetName

						const options = []
						for (let i = 0; i < paramCount; i++) {
							options.push({
								type: 'textinput',
								label: `Param ${i}`,
								id: `param${i}`,
								regex: this.REGEX_SOMETHING,
								default: presetOptions[i],
							})
						}

						actions[presetKey] = {
							actionId: actionId,
							label: label,
							options: options,
							func: new Function('n', 'return ' + commands[0]),
							tooltip: tooltip,
							groups: groups,
							presetName: presetName,
						}

						this.actionIdToPath[presetKey] = cmdPath_
						if (commands[0].includes('TOGGLES: ')) {
							actions[presetKey].toggles = actions[presetKey].func().TOGGLES
						}
					}
				} else {
					parseRoutes(childNode, cmdPath_)
				}
			}
		}
		parseRoutes(this.routes)

		this.actions = actions
		this.setActions(actions)
	},
	action = (action) => {
		const key = action.action
		const path = this.actionIdToPath[key]
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
