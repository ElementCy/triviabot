
'use strict'

const dotenv = require('dotenv')
const ENV = process.env.NODE_ENV || 'development'

if (ENV === 'development') dotenv.load()

const config = {
  ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  PROXY_URI: process.env.PROXY_URI,
  SLACK_TOKEN: 'xoxb-93766701408-UCQS7tM2BeWydIJCcgiQy3dQ', //process.env.SLACK_TOKEN,
  ICON_EMOJI: ':space_invader:'
}

module.exports = (key) => {
  if (!key) return config

  return config[key]
}
