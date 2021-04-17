const lodash = require('lodash')
const icons = require('./icons')

module.exports = {
	initPresets() {
		var presets = []
		for (const key of Object.keys(this.actions).sort()) {
			const path = this.actionKeyToPath[key]

			const preset = this.createPreset({
				id: key,
				category: path[0],
				text: key.replace('/', ' ').replace(/toggle$/, 'on/off'),
				icon: icons[key],
				actions: [key],
				feedbacks: [key],
			})
			presets.push({ ...preset, category: '_all' })
			if (key.endsWith('/toggle')) presets.push({ ...preset, category: '_toggles' })
			presets.push(preset)
		}
		this.setPresetDefinitions(presets)
	},

	createPreset({ id, category, text, icon, actions = [], releaseActions = [], feedbacks = [] }) {
		return {
			id: id,
			category: category,
			label: text,
			bank: {
				style: 'text',
				text: text,
				size: '18',
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
