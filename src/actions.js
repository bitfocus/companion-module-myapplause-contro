const lodash = require('lodash')
const Client = require('node-rest-client').Client

module.exports = {
	initActions() {
		this.actionDefinitions = {}
		this.actionIdToPath = {}

		const parseRoutes = (node, cmdPath = []) => {
			// Recursively parse ROUTES.json.
			// Actions, feedbacks and presets are generated dynamically from information in ROUTES.json.
			// ROUTES.json defines our actions on the client and on the server side.
			// The actions are defined in a tree like fashion.
			// The leafes of the tree define our actions. The nodes on the path to a leaf
			// define a cmd path that on the server side is used to offer the corresponding action
			// as http endpont. e.g. the http endpoint for the following command is: .../image/toggle

			// "image": {
			//     "toggle": {
			//         "commands": [ ... ],
			//         "tooltip": "...",
			//         "presetConfigurations": { ... },
			//         "categories": [ ... ]"
			// 	   }
			// }

			function isLeafNode(node) {
				return node.hasOwnProperty('commands') && lodash.isArray(node.commands)
			}

			for (const [key, childNode] of Object.entries(node)) {
				const cmdPath_ = cmdPath.concat([key])

				if (!isLeafNode(childNode)) {
					parseRoutes(childNode, cmdPath_)
				} else {
					let { commands, tooltip = '', presetConfigurations = {}, categories = [] } = childNode

					// get number of params
					const match = commands[0].match(/n\[\d+\]/g)
					const paramCount = match ? match.length : 0

					// create options for action
					const options = []
					for (let i = 0; i < paramCount; i++) {
						options.push({
							type: 'textinput',
							label: `Param ${i}`,
							id: `param${i}`,
							regex: this.REGEX_SOMETHING,
							default: undefined,
						})
					}

					// create action
					const actionId = cmdPath_.join('/')
					const label = cmdPath_.join(' ')
					const func = new Function('n', 'return ' + commands[0])
					// If this is a toggle command, register which configuration option is toggled.
					const isToggleFor = key === 'toggle' && commands[0].includes('TOGGLES: ') ? func().TOGGLES : ''
					const actionDefinition = {
						isToggleFor: isToggleFor,
						actionId: actionId,
						label: label,
						options: options,
						func: func,
						tooltip: tooltip,
						categories: categories,
						presetConfigurations: presetConfigurations,
						cmdPath: cmdPath_,
					}
					this.actionDefinitions[actionId] = actionDefinition
				}
			}
		}

		parseRoutes(this.routes)
		this.setActions(this.actionDefinitions)
	},
	action(action) {
		const actionId = action.action
		const cmdPath = this.actionDefinitions[actionId].cmdPath

		if (lodash.isEmpty(cmdPath)) {
			this.log('warn', 'Corresponding action for key "' + actionId + '" could not be found.')
			return
		}

		const params = Object.entries(action.options || {})
			.sort(([k0, v0], [k1, v1]) => k0 - k1)
			.map(([k, v]) => v || 0)
			.map(encodeURIComponent)

		let url = this.config.url
		if (!url.endsWith('/')) url = url + '/'
		url = url + cmdPath.concat(params).join('/')

		new Client()
			.get(url, (data, response) => {
				// TODO: wenn kein internet: response not defined?
				const successful = 200 <= response.statusCode && response.statusCode < 300
				this.status(successful ? this.STATUS_OK : this.STATUS_ERROR)
				try {
					this.lastAction = {
						browserConfig: JSON.parse(data.toString()),
						successful: successful,
					}
				} catch (error) {
					this.lastAction = {
						browserConfig: {},
						successful: false,
					}
				}
				this.checkAllFeedbacks()
			})
			.on('error', (error) => {
				this.status(this.STATUS_ERROR, response.statusCode.code)
				this.lastAction = {
					browserConfig: {},
					successful: false,
				}
				this.checkAllFeedbacks()
			})
	},
}
