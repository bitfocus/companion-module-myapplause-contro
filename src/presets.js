const lodash = require('lodash')

module.exports = {
	initPresets() {
		// Loop over actionDefinitions and corresponding presetConfigurations to generate presets.
		const presets = []
		for (const [actionId, actionDefinition] of Object.entries(this.actionDefinitions)) {
			const cmdPath = actionDefinition.cmdPath
			const presetConfigurations = actionDefinition.presetConfigurations
			const defaultCategoryPrefix = capitalizeFirstLetter(cmdPath[0])
			const additionalCategories = actionDefinition.categories

			// Add null presetConfiguration if presetConfigurations is empty
			if (lodash.isEmpty(presetConfigurations)) presetConfigurations[''] = []

			for (const [presetName, presetParams] of Object.entries(presetConfigurations)) {
				const presetOptions = {}
				presetParams.forEach((value, i) => {
					presetOptions[`param${i}`] = value
				})

				const iconPreset = this.createPreset({
					actionDefinition,
					category: defaultCategoryPrefix + ' (Icon)',
					showIcon: true,
					presetName,
					presetOptions,
				})
				const textPreset = this.createPreset({
					actionDefinition,
					category: defaultCategoryPrefix + ' (Text)',
					presetName,
					presetOptions,
				})

				additionalCategories.forEach((category) => {
					presets.push({ ...iconPreset, category: `${category} (Icon)` })
					presets.push({ ...textPreset, category: `${category} (Text)` })
				})

				const actionName = cmdPath[cmdPath.length - 1]
				if (actionName === 'on' || actionName === 'off') {
					presets.push({ ...iconPreset, category: 'ON_OFF (Icon)' })
					presets.push({ ...textPreset, category: 'ON_OFF (Text)' })
				} else {
					presets.push({ ...iconPreset, category: 'All (Icon)' })
					presets.push({ ...textPreset, category: 'All (Text)' })
					if (actionDefinition.isToggleFor) {
						presets.push({ ...iconPreset, category: 'Toggle (Icon)' })
						presets.push({ ...textPreset, category: 'Toggle (Text)' })
					}
					presets.push(iconPreset)
					presets.push(textPreset)
				}
			}
		}

		this.setPresetDefinitions(presets)
	},
	createPreset({ actionDefinition, category, showIcon, presetName, presetOptions }) {
		const actionId = actionDefinition.id
		const presetId = actionId + '/' + presetName
		const tooltip = actionDefinition.tooltip
		const icon = showIcon ? this.icons[actionId] : undefined

		altText =
			actionId
				.replace(/\/on$/, ' ✔️')
				.replace(/\/off$/, ' ❌')
				.replace(/\//g, ' ')
				.replace(/Total/g, ' Σ')
				.replace(/^app/, '📱')
				.replace(/^emoji/, '🙂')
				.replace(/reload/g, '🔃 ')
				.replace(/toggle$/, '✔️/❌') +
			' ' +
			presetName

		let shortText = ''
		if (actionId.match(/.*toggle$/)) shortText = '✔️/❌'
		else if (actionId.match(/.*\/on$/)) shortactionId = '✔️'
		else if (actionId.match(/.*\/off$/)) shortText = '❌'
		shortText = shortText + ' ' + presetName

		function size(text) {
			if (
				text.includes('awayteam') ||
				text.includes('hometeam') ||
				text.includes('mask') ||
				text.includes('fullscreen') ||
				text.includes('soundbuttons') ||
				text.includes('font')
			)
				return 14
			return text.length < 18 ? '18' : '14'
		}

		return {
			id: presetId,
			category: category,
			label: (tooltip || actionId.replace(/\//g, ' ')) + ' ' + presetName,
			bank: {
				style: 'text',
				text: icon ? shortText : altText,
				size: icon ? size(shortText) : size(altText),
				latch: false, // !lodash.isEmpty(releaseActions),
				png64: icon || this.icons['default'],
				alignment: icon ? 'center:bottom' : 'center:top',
				pngalignment: 'center:center',
				color: this.rgb(255, 255, 255),
				bgcolor: this.rgb(0, 0, 0),
			},
			actions: [{ action: actionId, options: presetOptions }],
			feedbacks: [{ type: actionId, options: presetOptions }],
			// release_actions: [{ action: id, options: {} }],
		}
	},
}

function capitalizeFirstLetter(string) {
	return string.charAt(0).toUpperCase() + string.slice(1)
}
