/* @refresh reload */
import { render } from 'solid-js/web'
import { Router } from '@solidjs/router'
import App from './App'
import './styles/main.css'

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
