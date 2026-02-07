import { Route } from '@solidjs/router'
import { lazy } from 'solid-js'
import Home from './pages/Home'
import Details from './pages/Details'
import Favicon from './pages/Favicon'

const Games = lazy(() => import('./pages/Games'))
const GameLayout = lazy(() => import('./pages/game/GameLayout'))
const Register = lazy(() => import('./pages/game/Register'))
const Login = lazy(() => import('./pages/game/Login'))
const Dashboard = lazy(() => import('./pages/game/Dashboard'))
const Team = lazy(() => import('./pages/game/Team'))
const Profile = lazy(() => import('./pages/game/Profile'))
const ResetPassword = lazy(() => import('./pages/game/ResetPassword'))

export default function App() {
  return (
    <>
      <Route path="/" component={Home} />
      <Route path="/details" component={Details} />
      <Route path="/favicon" component={Favicon} />
      <Route path="/games" component={Games} />
      <Route path="/game" component={GameLayout}>
        <Route path="/signup" component={Register} />
        <Route path="/login" component={Login} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/team" component={Team} />
        <Route path="/profile" component={Profile} />
        <Route path="/reset-password" component={ResetPassword} />
      </Route>
    </>
  )
}
