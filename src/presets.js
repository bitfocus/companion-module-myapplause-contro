const lodash = require('lodash')

module.exports = {
	initPresets() {
		const presets = []
		for (const [actionId, actionDefinition] of Object.entries(this.actionDefinitions)) {
			const cmdPath = actionDefinition.cmdPath
			const presetConfigurations = actionDefinition.presetConfigurations
			const icon = this.icons[actionId]
			const tooltip = actionDefinition.tooltip
			const defaultCategoryPrefix = capitalizeFirstLetter(cmdPath[0])
			const additionalCategories = actionDefinition.categories

			// Add null presetConfiguration if presetConfigurations is empty
			if (lodash.isEmpty(presetConfigurations)) presetConfigurations[''] = []

			for (const [presetName, presetParams] of Object.entries(presetConfigurations)) {
				const presetId = actionId + '/' + presetName
				const label = actionDefinition.cmdPath.join(' ') + ' ' + presetName
				const presetOptions = Object.fromEntries(presetParams.map((value, i) => [`param${i}`, value]))

				const iconPreset = this.createPreset({
					category: defaultCategoryPrefix + ' (Icon)',
					icon,
					presetId,
					actionId,
					presetName,
					tooltip,
					presetOptions,
				})
				const textPreset = this.createPreset({
					category: defaultCategoryPrefix + ' (Text)',
					presetId,
					actionId,
					presetName,
					tooltip,
					presetOptions,
				})

				const actionName = cmdPath[cmdPath.length - 1]
				if (actionName === 'on' || actionName === 'off') {
					presets.push({ ...iconPreset, category: 'NoToggle (Icon)' })
					presets.push({ ...textPreset, category: 'NoToggle (Text)' })
					additionalCategories.forEach((category) => {
						presets.push({ ...iconPreset, category: `${category} (Icon)` })
						presets.push({ ...textPreset, category: `${category} (Text)` })
					})
				} else {
					presets.push({ ...iconPreset, category: 'All (Icon)' })
					presets.push({ ...textPreset, category: 'All (Text)' })
					if (actionDefinition.isToggleFor) {
						presets.push({ ...iconPreset, category: 'Toggle (Icon)' })
						presets.push({ ...textPreset, category: 'Toggle (Text)' })
					}
					presets.push(iconPreset)
					presets.push(textPreset)
					additionalCategories.forEach((category) => {
						presets.push({ ...iconPreset, category: `${category} (Icon)` })
						presets.push({ ...textPreset, category: `${category} (Text)` })
					})
				}
			}
		}

		this.setPresetDefinitions(presets)
	},
	createPreset({ presetId, category, tooltip, actionId, presetName, icon, presetOptions }) {
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
