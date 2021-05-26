const routes = require('./ROUTES.json')
const lodash = require('lodash')

// Parse ROUTES.json to generate actions dynamically.
const extractActions = (obj, path = []) => {
	if (!lodash.isObject(obj)) return
	for (const key of Object.keys(obj)) {
		const child = obj[key]
		if (!lodash.isObject(child)) continue
		console.log('\t'.repeat(path.length), key)
		extractActions(child, path.concat([key]))
	}
}
extractActions(routes)
