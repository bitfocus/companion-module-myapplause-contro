const lodash = require('lodash')
const Client = require('node-rest-client').Client

module.exports = {
	initActions() {
		const actions = {}
		this.actionKeyToPath = {}

		// Parse ROUTES.json to generate actions dynamically.
		const extractActions = (obj, path = []) => {
			if (!lodash.isObject(obj)) return

			for (const key of Object.keys(obj)) {
				const child = obj[key]
				if (lodash.isString(child)) {
					const key = path.join('/')
					const label = path.join(' ')
					const paramCount = (child.match(/n\[\d+\]/g) || []).length

					const options = []
					for (let i = 0; i < paramCount; i++) {
						options.push({
							type: 'textinput',
							label: `Param ${i}`,
							id: `param${i}`,
							regex: this.REGEX_SOMETHING,
						})
					}

					actions[key] = {
						label: label,
						options: options,
						func: new Function('n', 'return ' + child),
					}

					if (child.includes('TOGGLES: ')) {
						actions[key].toggles = actions[key].func().TOGGLES
					}

					this.actionKeyToPath[key] = path
				} else {
					extractActions(child, path.concat([key]))
				}
			}
		}
		extractActions(this.routes)

		this.actions = actions
		this.setActions(actions)
	},
	action(action) {
		const key = action.action
		const path = this.actionKeyToPath[key]

		const params = Object.entries(action.options || {})
			.sort(([k0, v0], [k1, v1]) => k0 - k1)
			.map(([k, v]) => v || 0)

		let url = this.config.url
		if (!url.endsWith('/')) url = url + '/'
		url = url + path.concat(params).join('/')

		const isToggle = ['on', 'off'].includes(path[path.length - 1])
		const isOn = path[path.length - 1] !== 'off'
		const toggleKey = path.slice(0, path.length - 1).join('/')

		new Client()
			.get(url, (data, response) => {
				const successful = 200 <= response.statusCode && response.statusCode < 300
				this.status(successful ? this.STATUS_OK : this.STATUS_ERROR)
				const actionState = {
					state: isOn,
					options: action.options,
					successful,
				}
				this.actionState[key] = actionState
				if (isToggle) this.actionState[toggleKey] = actionState

				this.lastAction = {
					key: action.action,
					browserConfig: JSON.parse(data.toString()),
					successful: successful,
				}

				if (successful) this.checkAllFeedbacks()
			})
			.on('error', (error) => {
				this.status(this.STATUS_ERROR, response.statusCode.code)
				const actionState = {
					state: isOn,
					options: action.options,
					successful: false,
				}
				this.actionState[key] = actionState
				if (isToggle) this.actionState[toggleKey] = actionState

				this.lastAction = {
					key: action.action,
					browserConfig: {},
					successful: false,
				}

				this.checkAllFeedbacks()
			})
	},
}
