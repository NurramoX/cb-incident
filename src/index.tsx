/* @refresh reload */
import { render } from 'solid-js/web'
import { Router } from '@solidjs/router'
import App from './App'
import './styles/main.css'

// Handle Supabase recovery redirects — redirect to reset password page with hash params preserved
if (window.location.hash.includes('type=recovery')) {
  window.location.replace('/game/reset-password' + window.location.hash)
}

const root = document.getElementById('app')

if (!root) {
  throw new Error('Root element not found')
}

render(
  () => (
    <Router>
      <App />
    </Router>
  ),
  root
)
