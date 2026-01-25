import { JSX } from 'solid-js'
import Background from '../../components/Background'

interface GameLayoutProps {
  children?: JSX.Element
}

export default function GameLayout(props: GameLayoutProps) {
  return (
    <>
      <Background darker />
      {props.children}
    </>
  )
}
