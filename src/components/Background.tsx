interface BackgroundProps {
  darker?: boolean
}

export default function Background(props: BackgroundProps) {
  return (
    <>
      {/* Background image */}
      <div class="fixed inset-0 z-0">
        <img
          src="/shibuya.png"
          alt=""
          class={`w-full h-full object-cover sepia-[0.3] saturate-[1.3] ${
            props.darker
              ? 'brightness-[0.4] hue-rotate-[-10deg]'
              : 'brightness-50 hue-rotate-[-10deg]'
          }`}
        />
      </div>

      {/* Overlay gradient */}
      <div
        class={`fixed inset-0 z-[1] ${
          props.darker
            ? '[background:linear-gradient(180deg,rgba(10,5,5,0.6)_0%,rgba(74,0,0,0.4)_30%,rgba(10,5,5,0.8)_100%)]'
            : '[background:linear-gradient(180deg,rgba(10,5,5,0.4)_0%,rgba(74,0,0,0.3)_30%,rgba(10,5,5,0.7)_100%)]'
        }`}
      />

      {/* Red glow */}
      <div
        class={`fixed inset-0 z-[2] pointer-events-none [animation:ambient-flicker_4s_infinite] ${
          props.darker
            ? '[background:radial-gradient(ellipse_at_50%_30%,rgba(220,20,60,0.1)_0%,transparent_60%)]'
            : '[background:radial-gradient(ellipse_at_50%_30%,rgba(220,20,60,0.15)_0%,transparent_60%)]'
        }`}
      />

      {/* Scanlines */}
      <div class="fixed inset-0 pointer-events-none z-[100] opacity-40 [background:repeating-linear-gradient(0deg,rgba(0,0,0,0.08)_0px,rgba(0,0,0,0.08)_1px,transparent_1px,transparent_3px)]" />
    </>
  )
}
