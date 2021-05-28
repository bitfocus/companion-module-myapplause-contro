const Client = require('node-rest-client').Client

const instance_skel = require('../../../instance_skel')

const presets = require('./presets')
const actions = require('./actions')
const feedbacks = require('./feedbacks')
const ROUTES = require('./ROUTES.json')
const ICONS = require('./ICONS.json')

class instance extends instance_skel {
	constructor(system, id, config) {
		super(system, id, config)

		Object.assign(this, {
			...presets,
			...actions,
			...feedbacks,
		})

		// Use either newer downloaded ROUTES/ICONS or use
		// the one delivered with the module.
		// TODO
		// this.routes = this.config.ROUTES || ROUTES
		this.routes = ROUTES

		// TODO: no internet

		this.icons = this.config.ICONS || ICONS

		this.BUTTON_COLOR_ON = '#0b730d'
		this.BUTTON_COLOR_OFF = '#0000ff'
		this.BUTTON_COLOR_ERROR = '#ff00ff'

		this.feedbackKeys = []
		this.lastAction = {}
	}

	updateConfig = (config) => {
		this.config = config
		this.initButtonColors()
	}

	init = () => {
		this.status(isValidHttpUrl(this.config.url) ? this.STATUS_OK : this.STATUS_ERROR)
		this.initButtonColors()
		this.initActions()
		this.initFeedbacks()
		this.initPresets()
		this.getMyApplauseStateAndCheckFeedbacks()
		this.downloadNewConfig()
	}

	initButtonColors = () => {
		const hexStringToRgb = (hexString) => {
			if (!hexString) return null
			const int = parseInt(hexString.replace('#', ''), 16)
			const r = (int >> 16) & 255
			const g = (int >> 8) & 255
			const b = int & 255
			return this.rgb(r, g, b)
		}

		this.button_color_on = hexStringToRgb(this.config.button_color_on, this.BUTTON_COLOR_ON)
		this.button_color_on = this.button_color_on == null ? hexStringToRgb(this.BUTTON_COLOR_ON) : this.button_color_on

		this.button_color_off = hexStringToRgb(this.config.button_color_off)
		this.button_color_off =
			this.button_color_off == null ? hexStringToRgb(this.BUTTON_COLOR_OFF) : this.button_color_off

		this.button_color_error = hexStringToRgb(this.config.button_color_error)
		this.button_color_error =
			this.button_color_error == null ? hexStringToRgb(this.BUTTON_COLOR_ERROR) : this.button_color_error
	}

	downloadNewConfig = () => {
		// Download new ROUTES config which is used to generate actions, presets,
		// feedbacks dynamically.
		// New ROUTES is only used after restart of companion.

		// Download only if the user checked the corresponding checkbox.
		if (!this.config.download_routes) return

		const routesUrl = 'https://ws.myapplause.app/rc/companion/routes'
		// TODO: what happens if no internet?
		new Client()
			.get(routesUrl, (data, response) => {
				const successful = 200 <= response.statusCode && response.statusCode < 300
				if (!successful) {
					this.log('warn', 'Could not download new MyApplause Control config.')
				} else {
					this.config.ROUTES = JSON.parse(data.toString())
					this.saveConfig()
					this.log(
						'info',
						'Succesfuly downloaded MyApplause Control config. Changes will only be effective after you restarted Companion.'
					)
				}
			})
			.on('error', function (err) {
				this.log('warn', 'Could not download new MyApplause Control config.')
			})

		const iconsUrl = 'https://ws.myapplause.app/rc/companion/icons'
		new Client()
			.get(iconsUrl, (data, response) => {
				const successful = 200 <= response.statusCode && response.statusCode < 300
				if (!successful) {
					this.log('warn', 'Could not download new MyApplause Control icons.')
				} else {
					this.config.ICONS = JSON.parse(data.toString())
					this.saveConfig()
					this.log(
						'info',
						'Succesfuly downloaded MyApplause Control icons. Changes will only be effective after you restarted Companion.'
					)
				}
			})
			.on('error', function (err) {
				this.log('warn', 'Could not download new MyApplause Control icons.')
			})
	}

	getMyApplauseStateAndCheckFeedbacks = () => {
		// Get current configuration of the MyApplause Server instance to
		// set feedbacks.
		if (!this.config.url) return
		let url = this.config.url
		if (!url.endsWith('/')) url = url + '/'
		url = url + 'config/dump'
		// TODO: what happens if no internet?
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
					const pid = match[1]
					const eventId = match[2]
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

	config_fields = () => {
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
