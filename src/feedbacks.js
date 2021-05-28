module.exports = {
	initFeedbacks() {
		const feedbacks = {}

		for (const [actionId, actionDefinition] of Object.entries(this.actionDefinitions)) {
			if (actionDefinition.isToggleFor) {
				feedbacks[actionId] = {
					label: actionId,
					description: actionId,
					options: [],
					callback: (feedback, bank) => {
						const { successful, browserConfig } = this.lastAction
						if (successful) {
							// TODO
							const toggledConfigurationOption = actionDefinition.isToggleFor
							const optionIsOn = browserConfig[toggledConfigurationOption]
							return { bgcolor: optionIsOn ? this.button_color_on : this.button_color_off }
						} else {
							return { bgcolor: this.button_color_error }
						}
					},
				}
			} else {
				feedbacks[actionId] = {
					label: actionId,
					description: actionId,
					options: actionDefinition.options,
					callback: (feedback, bank) => {
						const { successful, browserConfig } = this.lastAction
						if (successful) {
							// TODO

							const params = Object.keys(feedback.options || {})
								.sort()
								.map((key) => feedback.options[key])
							const expectedConfig = actionDefinition.func(params)
							const expectedConfigMatchesBrowserConfig = Object.keys(expectedConfig).every(
								(key) => expectedConfig[key] == browserConfig[key]
							)
							if (!expectedConfigMatchesBrowserConfig) return
							return { bgcolor: this.button_color_on }
						} else {
							return { bgcolor: this.button_color_error }
						}
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
