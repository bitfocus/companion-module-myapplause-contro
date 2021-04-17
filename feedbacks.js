const lodash = require('lodash')
const icons = require('./icons')

module.exports = {
	initFeedbacks() {
		const feedbacks = {}

		for (const key of Object.keys(this.actions)) {
			if (key.endsWith('/toggle')) {
				feedbacks[key] = {
					label: key,
					description: key,
					options: [],
					callback: (feedback, bank) => {
						const { successful, browserConfig } = this.lastAction
						if (successful == false) return { bgcolor: this.rgb(255, 0, 255) }
						const toggle = this.actions[key].toggles[0]
						const on = browserConfig[toggle]
						return { bgcolor: on ? this.rgb(11, 115, 13) : this.rgb(0, 0, 255) }
					},
				}
			} else {
				feedbacks[key] = {
					label: key,
					description: key,
					options: this.actions[key].options,
					callback: (feedback, bank) => {
						const { successful, browserConfig } = this.lastAction
						if (successful == false) return { bgcolor: this.rgb(255, 0, 255) }

						const params = Object.keys(feedback.options)
							.sort()
							.map((key) => feedback.options[key])
						const expectedConfig = this.actions[key].func(params)
						const expectedConfigMatchesBrowserConfig = Object.keys(expectedConfig).every(
							(key) => expectedConfig[key] == browserConfig[key]
						)
						if (!expectedConfigMatchesBrowserConfig) return

						return { bgcolor: key.endsWith('off') ? this.rgb(0, 0, 255) : this.rgb(11, 115, 13) }
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
