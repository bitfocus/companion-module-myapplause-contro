const lodash = require('lodash')
const icons = require('./icons')

module.exports = {
	initFeedbacks() {
		const feedbacks = {}

		for (const key of Object.keys(this.actions)) {
			if (key.endsWith('/toggle ')) {
				feedbacks[key] = {
					label: key,
					description: key,
					options: [],
					callback: (feedback, bank) => {
						const { successful, browserConfig } = this.lastAction
						if (successful == false) return { bgcolor: this.button_color_error }
						const toggle = this.actions[key].toggles[0]
						const on = browserConfig[toggle]
						return { bgcolor: on ? this.button_color_on : this.button_color_off }
					},
				}
			} else {
				feedbacks[key] = {
					label: key,
					description: key,
					options: this.actions[key].options,
					callback: (feedback, bank) => {
						const { successful, browserConfig } = this.lastAction
						if (successful == false) return { bgcolor: this.button_color_error }
						const params = Object.keys(feedback.options || {})
							.sort()
							.map((key) => feedback.options[key])
						const expectedConfig = this.actions[key].func(params)
						const expectedConfigMatchesBrowserConfig = Object.keys(expectedConfig).every(
							(key) => expectedConfig[key] == browserConfig[key]
						)
						if (!expectedConfigMatchesBrowserConfig) return
						return { bgcolor: this.button_color_on }
					},
				}
			}
		}
		this.setFeedbackDefinitions(feedbacks)
		this.feedbackKeys = Object.keys(feedbacks)
	},
	checkAllFeedbacks() {
		this.feedbackKeys.forEach((key) => this.checkFeedbacks(key))
	},
}
