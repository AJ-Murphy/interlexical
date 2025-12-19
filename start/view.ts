import edge from 'edge.js'
import env from '#start/env'
import { addCollection, edgeIconify } from 'edge-iconify'
import { icons as mi } from '@iconify-json/mi'

/**
 * Add mi collection
 */
addCollection(mi)

/**
 * Register a plugin
 */
edge.use(edgeIconify)

/**
 * Define a global property
 */
edge.global('appUrl', env.get('APP_URL'))
