const lodash = require('lodash')
const icons = require('./icons')

module.exports = {
	initPresets() {
		var presets = []
		for (const key of Object.keys(this.actions)) {
			const path = this.actionKeyToPath[key]
			const icon = icons[key]

			const preset = this.createPreset({
				id: key,
				category: path[0],
				text: key,
				icon: undefined,
				actions: [key],
				feedbacks: [key],
			})
			presets.push({ ...preset, category: '_all' })
			if (key.endsWith('/toggle')) presets.push({ ...preset, category: '_toggles' })
			presets.push(preset)

			if (icon) {
				const preset = this.createPreset({
					id: key,
					category: path[0],
					text: key,
					icon: icon,
					actions: [key],
					feedbacks: [key],
				})
				presets.push({ ...preset, category: '_all' })
				if (key.endsWith('/toggle')) presets.push({ ...preset, category: '_toggles' })
				presets.push(preset)
			}
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
