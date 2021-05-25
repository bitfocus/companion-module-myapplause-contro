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
		this.initButtonColors = this.initButtonColors.bind(this)
		this.checkAllFeedbacks = this.checkAllFeedbacks.bind(this)
		this.initPresets = this.initPresets.bind(this)
		this.getConfigAndCheckFeedbacks = this.getConfigAndCheckFeedbacks.bind(this)

		// Use either newer downloaded ROUTES or use
		// the one delivered with the module.
		this.routes = this.config.ROUTES || ROUTES

		this.BUTTON_COLOR_ON = '#0b730d'
		this.BUTTON_COLOR_OFF = '#0000ff'
		this.BUTTON_COLOR_ERROR = '#ff00ff'

		this.feedbackKeys = []
		this.lastAction = {}
	}

	updateConfig(config) {
		this.config = config
		this.initButtonColors()
	}

	init() {
		// Actions, feedbacks and presets are generated dynamically from information in ROUTES.json.
		// The same information is used on the server side to generate the corresponding http routes.

		this.initActions()
		this.status(isValidHttpUrl(this.config.url) ? this.STATUS_OK : this.STATUS_ERROR)
		this.initButtonColors()
		this.initFeedbacks()
		this.initPresets()
		this.getConfigAndCheckFeedbacks()
		this.downloadROUTES()
	}

	initButtonColors() {
		const hexStringToRgb = (hexString, defaultHexString) => {
			var bigint = parseInt(hexString.replace('#', ''), 16) || parseInt(defaultHexString.replace('#', ''), 16)
			var r = (bigint >> 16) & 255
			var g = (bigint >> 8) & 255
			var b = bigint & 255

			return this.rgb(r, g, b)
		}

		this.button_color_on = hexStringToRgb(this.config.button_color_on, this.BUTTON_COLOR_ON)
		this.button_color_off = hexStringToRgb(this.config.button_color_off, this.BUTTON_COLOR_OFF)
		this.button_color_error = hexStringToRgb(this.config.button_color_error, this.BUTTON_COLOR_ERROR)
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
				const regex = /\/rc\/pid\/(\w+)\/(\w+)\//
				const match = url.match(regex)
				if (match) {
					const eventId = match[1]
					const pid = match[2]
					const panoramaUrl = `https://macs.myapplause.app/id/${eventId}/panorama?pid=${pid}`
					this.log(
						'warn',
						`Initial MyApplause state was not transmitted. This URL needs to be open in a browser: ${panoramaUrl}`
					)
				} else {
					this.log(
						'warn',
						'Initial MyApplause state was not transmitted. Is the MyApplause Panorama opened in a browser?'
					)
				}
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
				width: 12,
				default: '',
			},
			{
				type: 'textinput',
				label: 'Button Color (HEX): Success - enabled',
				id: 'button_color_on',
				default: this.BUTTON_COLOR_ON,
			},
			{
				type: 'textinput',
				label: 'Button Color (HEX): Success - disabled',
				id: 'button_color_off',
				default: this.BUTTON_COLOR_OFF,
			},
			{
				type: 'textinput',
				label: 'Button Color (HEX): Error',
				id: 'button_color_error',
				default: this.BUTTON_COLOR_ERROR,
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
