const lodash = require('lodash')

module.exports = {
	initPresets() {
		var presets = []
		for (const predefineKey of Object.keys(this.actions)) {
			const action = this.actions[predefineKey]
			const actionKey = action.actionKey
			const predefineName = action.predefineName
			const path = this.actionKeyToPath[predefineKey]
			const icon = this.icons[action.actionKey]
			const tooltip = action.tooltip
			const additionalCategories = action.groups

			const iconPreset = this.createPreset({
				id: predefineKey,
				category: capitalizeFirstLetter(path[0]) + ' (Icon)',
				actionKey: actionKey,
				predefineName: predefineName,
				icon: icon,
				tooltip: tooltip,
				actions: [predefineKey],
				feedbacks: [predefineKey],
			})
			const textPreset = this.createPreset({
				id: predefineKey,
				category: capitalizeFirstLetter(path[0]) + ' (Text)',
				actionKey: actionKey,
				predefineName: predefineName,
				icon: undefined,
				tooltip: tooltip,
				actions: [predefineKey],
				feedbacks: [predefineKey],
			})

			const actionName = path[path.length - 1]
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
				if (predefineKey.endsWith('/toggle ')) presets.push({ ...iconPreset, category: 'Toggle (Icon)' })
				if (predefineKey.endsWith('/toggle ')) presets.push({ ...textPreset, category: 'Toggle (Text)' })
				presets.push(iconPreset)
				presets.push(textPreset)
				additionalCategories.forEach((category) => {
					presets.push({ ...iconPreset, category: `${category} (Icon)` })
					presets.push({ ...textPreset, category: `${category} (Text)` })
				})
			}
		}
		this.setPresetDefinitions(presets)
	},

	createPreset({
		id,
		category,
		tooltip,
		actionKey,
		predefineName,
		icon,
		actions = [],
		releaseActions = [],
		feedbacks = [],
	}) {
		altText =
			actionKey
				.replace(/\/on$/, ' ✔️')
				.replace(/\/off$/, ' ❌')
				.replace(/\//g, ' ')
				.replace(/Total/g, ' Σ')
				.replace(/^app/, '📱')
				.replace(/^emoji/, '🙂')
				.replace(/reload/g, '🔃 ')
				.replace(/toggle$/, '✔️/❌') +
			' ' +
			predefineName

		let shortText = ''
		if (actionKey.match(/.*toggle$/)) shortText = '✔️/❌'
		else if (actionKey.match(/.*\/on$/)) shortactionKey = '✔️'
		else if (actionKey.match(/.*\/off$/)) shortText = '❌'
		shortText = shortText + ' ' + predefineName

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
			id: id,
			category: category,
			label: (tooltip || actionKey.replace(/\//g, ' ')) + ' ' + predefineName,
			bank: {
				style: 'text',
				text: icon ? shortText : altText,
				size: icon ? size(shortText) : size(altText),
				latch: !lodash.isEmpty(releaseActions),
				png64: icon || this.icons['default'],
				alignment: icon ? 'center:bottom' : 'center:top',
				pngalignment: 'center:center',
				color: this.rgb(255, 255, 255),
				bgcolor: this.rgb(0, 0, 0),
			},
			actions: actions.map((action) => ({ action })),
			release_actions: releaseActions.map((action) => ({ action })),
			feedbacks: feedbacks.map((type) => ({ type })),
		}
	},
}

function capitalizeFirstLetter(string) {
	return string.charAt(0).toUpperCase() + string.slice(1)
}
