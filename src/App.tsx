import { Route } from '@solidjs/router'
import { lazy } from 'solid-js'
import Home from './pages/Home'
import Details from './pages/Details'

const GameLayout = lazy(() => import('./pages/game/GameLayout'))
const Register = lazy(() => import('./pages/game/Register'))
const Login = lazy(() => import('./pages/game/Login'))

export default function App() {
  return (
    <>
      <Route path="/" component={Home} />
      <Route path="/details" component={Details} />
      <Route path="/game" component={GameLayout}>
        <Route path="/register" component={Register} />
        <Route path="/login" component={Login} />
      </Route>
    </>
  )
}
