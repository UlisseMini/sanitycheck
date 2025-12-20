// ABOUTME: Auto-reload extension during development.
// ABOUTME: Connects to dev server websocket and reloads on file changes.

import { DEBUG_MODE } from './config'

if (DEBUG_MODE) {
  const ws = new WebSocket('ws://localhost:8890')

  ws.onopen = () => {
    console.log('SanityCheck: Connected to dev reload server')
  }

  ws.onmessage = (event) => {
    if (event.data === 'reload') {
      console.log('SanityCheck: Reloading extension...')
      chrome.runtime.reload()
    }
  }

  ws.onclose = () => {
    console.log('SanityCheck: Dev reload server disconnected')
  }
}
