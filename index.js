const Client = require('node-rest-client').Client

const instance_skel = require('../../instance_skel')

const presets = require('./presets')
const actions = require('./actions')
const feedbacks = require('./feedbacks')
const { resolve } = require('app-root-path')
const { reject } = require('lodash')
const ROUTES = require('./ROUTES.json')

class instance extends instance_skel {
	constructor(system, id, config) {
		super(system, id, config)

		Object.assign(this, {
			...presets,
			...actions,
			...feedbacks,
		})

		this.init = this.init.bind(this)
		this.config_fields = this.config_fields.bind(this)
		this.destroy = this.destroy.bind(this)
		this.initActions = this.initActions.bind(this)
		this.action = this.action.bind(this)
		this.initFeedbacks = this.initFeedbacks.bind(this)
		this.checkAllFeedbacks = this.checkAllFeedbacks.bind(this)
		this.initPresets = this.initPresets.bind(this)

		this.config = config
		this.routes = ROUTES
		this.actionState = {}
		this.feedbackKeys = []
		this.lastAction = {}
	}

	init() {
		this.initActions()
		this.status(isValidHttpUrl(this.config.url) ? this.STATUS_OK : this.STATUS_ERROR)
		this.initFeedbacks()
		this.initPresets()

		if (!this.config.url) return
		let url = this.config.url
		if (!url.endsWith('/')) url = url + '/'
		url = url + 'config/dump'
		new Client().get(url, (data, response) => {
			const successful = 200 <= response.statusCode && response.statusCode < 300
			this.status(successful ? this.STATUS_OK : this.STATUS_ERROR)

			this.lastAction = {
				browserConfig: successful ? JSON.parse(data.toString()) : {},
				successful: successful,
			}

			this.checkAllFeedbacks()
		})
	}

	config_fields() {
		return [
			{
				type: 'text',
				id: 'info',
				width: 12,
				label: 'Information',
				value: 'This is the MyApplause control module.',
			},
			{
				type: 'textinput',
				id: 'url',
				label: 'URL',
				width: 6,
				default: '',
			},
		]
	}

	// When module gets deleted
	destroy() {
		this.debug('destroy', this.id)
	}
}

function isValidHttpUrl(string) {
	let url
	try {
		url = new URL(string)
	} catch (_) {
		return false
	}
	return url.protocol === 'http:' || url.protocol === 'https:'
}

exports = module.exports = instance
