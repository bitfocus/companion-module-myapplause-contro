module.exports = {
	initFeedbacks() {
		// Loop over actionDefinitions to generate corresponding feedbacks.
		const feedbacks = {}
		for (const [actionId, actionDefinition] of Object.entries(this.actionDefinitions)) {
			if (actionDefinition.isToggleFor) {
				// Generate feedback for toggle action.
				feedbacks[actionId] = {
					label: actionId,
					description: actionId,
					options: [],
					callback: (feedback, bank) => {
						const { successful, browserConfig } = this.lastAction
						if (successful) {
							const toggledConfigurationOption = actionDefinition.isToggleFor
							const optionIsOn = browserConfig[toggledConfigurationOption]
							return { bgcolor: optionIsOn ? this.button_color_on : this.button_color_off }
						} else {
							return { bgcolor: this.button_color_error }
						}
					},
				}
			} else {
				// Generate feedback for non-toggle action.
				feedbacks[actionId] = {
					label: actionId,
					description: actionId,
					options: actionDefinition.options,
					callback: (feedback, bank) => {
						const { successful, browserConfig } = this.lastAction
						if (successful) {
							const params = Object.keys(feedback.options || {})
								.sort()
								.map((key) => feedback.options[key])
							const expectedConfig = actionDefinition.func(params)
							const expectedConfigMatchesBrowserConfig = Object.keys(expectedConfig).every(
								(key) => expectedConfig[key] == browserConfig[key]
							)
							if (expectedConfigMatchesBrowserConfig) {
								return { bgcolor: this.button_color_on }
							} else {
								return
							}
						} else {
							return { bgcolor: this.button_color_error }
						}
					},
				}
			}
		}
		this.setFeedbackDefinitions(feedbacks)
		this.feedbackIds = Object.keys(feedbacks)
	},
	checkAllFeedbacks() {
		this.feedbackIds.forEach((key) => this.checkFeedbacks(key))
	},
}
