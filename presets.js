const lodash = require('lodash')
const icons = require('./icons')

module.exports = {
	initPresets() {
		var presets = []
		for (const key of Object.keys(this.actions)) {
			const path = this.actionKeyToPath[key]
			const icon = icons[key]

			const iconPreset = this.createPreset({
				id: key,
				category: capitalizeFirstLetter(path[0]) + ' Commands (icon)',
				text: key,
				icon: icon,
				actions: [key],
				feedbacks: [key],
			})
			const textPreset = this.createPreset({
				id: key,
				category: capitalizeFirstLetter(path[0]) + ' Commands (text)',
				text: key,
				icon: undefined,
				actions: [key],
				feedbacks: [key],
			})

			presets.push({ ...iconPreset, category: 'All Commands (icon)' })
			presets.push({ ...textPreset, category: 'All Commands (text)' })
			if (key.endsWith('/toggle')) presets.push({ ...iconPreset, category: 'Toggle Commands (icon)' })
			if (key.endsWith('/toggle')) presets.push({ ...textPreset, category: 'Toggle Commands (text)' })
			presets.push(iconPreset)
			presets.push(textPreset)
		}
		this.setPresetDefinitions(presets)
	},

	createPreset({ id, category, text, icon, actions = [], releaseActions = [], feedbacks = [] }) {
		altText = text
			.replace(/\/on$/, ' ✔️')
			.replace(/\/off$/, ' ❌')
			.replaceAll('/', ' ')
			.replaceAll('Total', ' Σ')
			.replace(/^app/, '📱')
			.replace(/^emoji/, '🙂')
			.replaceAll('reload', '🔃 ')
			.replace(/toggle$/, '✔️/❌')

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
			label: text.replaceAll('/', ' '),
			bank: {
				style: 'text',
				text: icon ? '' : altText,
				size: size(altText),
				latch: !lodash.isEmpty(releaseActions),
				png64: icon || icons['default'],
				alignment: 'center:top',
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
