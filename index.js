const Client = require('node-rest-client').Client

const instance_skel = require('../../instance_skel')

const presets = require('./presets')
const actions = require('./actions')
const feedbacks = require('./feedbacks')
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
		this.downloadROUTES = this.downloadROUTES.bind(this)
		this.config_fields = this.config_fields.bind(this)
		this.destroy = this.destroy.bind(this)
		this.initActions = this.initActions.bind(this)
		this.action = this.action.bind(this)
		this.initFeedbacks = this.initFeedbacks.bind(this)
		this.checkAllFeedbacks = this.checkAllFeedbacks.bind(this)
		this.initPresets = this.initPresets.bind(this)
		this.getConfigAndCheckFeedbacks = this.getConfigAndCheckFeedbacks.bind(this)

		this.config = config
		// Use either newer downloaded ROUTES or use
		// the one delivered with the module.
		this.routes = this.config.ROUTES || ROUTES

		this.actionState = {}
		this.feedbackKeys = []
		this.lastAction = {}
	}

	init() {
		// Actions, feedbacks and presets are generated dynamically from information in ROUTES.json.
		// The same information is used on the server side to generate the corresponding http routes.

		this.initActions()
		this.status(isValidHttpUrl(this.config.url) ? this.STATUS_OK : this.STATUS_ERROR)
		this.initFeedbacks()
		this.initPresets()
		this.getConfigAndCheckFeedbacks()
		this.downloadROUTES()
	}

	downloadROUTES() {
		// Download new ROUTES config which is used to generate actions, presets,
		// feedbacks dynamically.
		// New ROUTES is only used after restart of companion.

		// Download only if the user checked the corresponding checkbox.
		if (!this.config.download_routes) return

		const url = 'http://mars.hackcare.net/public/ROUTES.json'
		new Client().get(url, (data, response) => {
			const successful = 200 <= response.statusCode && response.statusCode < 300
			if (!successful) return
			this.config.ROUTES = data
			this.saveConfig()
		})
	}

	getConfigAndCheckFeedbacks() {
		// Get current configuration of the MyApplause Server instance to
		// set feedbacks.
		if (!this.config.url) return
		let url = this.config.url
		if (!url.endsWith('/')) url = url + '/'
		url = url + 'config/dump'
		new Client().get(url, (data, response) => {
			let successful = 200 <= response.statusCode && response.statusCode < 300
			let browserConfig
			try {
				browserConfig = JSON.parse(data.toString())
				this.lastAction = {
					browserConfig,
					successful,
				}
				this.checkAllFeedbacks()
			} catch (error) {
				this.log('warn', 'Initial MyApplause state was not transmitted.')
			}

			this.status(successful ? this.STATUS_OK : this.STATUS_ERROR)
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
				type: 'checkbox',
				id: 'download_routes',
				label: 'Download newest MyApplause Control config on start',
				width: 12,
				tooltip: 'The MyApplause Control config is used to generate actions, feedbacks and presets automatically.',
				default: false,
			},
			// URL of the MyApplause Server instance.
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
