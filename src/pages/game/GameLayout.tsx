import { JSX } from 'solid-js'
import Background from '../../components/Background'
import Particles from '../../components/Particles'

interface GameLayoutProps {
  children?: JSX.Element
}

export default function GameLayout(props: GameLayoutProps) {
  return (
    <>
      <Background darker />
      <Particles />
      {props.children}
    </>
  )
}
