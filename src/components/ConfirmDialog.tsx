import { Show } from 'solid-js'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning'
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog(props: ConfirmDialogProps) {
  const variant = () => props.variant ?? 'danger'

  return (
    <Show when={props.open}>
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <div
          class="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={props.onCancel}
        />

        {/* Dialog */}
        <div
          class={`relative w-full max-w-sm bg-dark-bg border overflow-hidden animate-in fade-in zoom-in-95 duration-200 ${
            variant() === 'danger' ? 'border-crimson/40' : 'border-pale-gold/40'
          }`}
        >
          {/* Header */}
          <div class={`p-5 border-b ${
            variant() === 'danger' ? 'border-crimson/20' : 'border-pale-gold/20'
          }`}>
            <h2 class={`font-orbitron text-[0.85rem] uppercase tracking-[0.15em] ${
              variant() === 'danger' ? 'text-crimson' : 'text-pale-gold'
            }`}>
              {props.title}
            </h2>
          </div>

          {/* Body */}
          <div class="p-5">
            <p class="font-rajdhani text-white/70 text-base leading-relaxed">
              {props.message}
            </p>
          </div>

          {/* Actions */}
          <div class={`flex h-12 border-t ${
            variant() === 'danger' ? 'border-crimson/20' : 'border-pale-gold/20'
          }`}>
            <button
              onClick={props.onCancel}
              disabled={props.loading}
              class={`flex-1 font-orbitron text-[0.7rem] text-white/40 uppercase tracking-[0.2em] hover:text-white/70 hover:bg-white/5 transition-all duration-200 disabled:opacity-50 border-r ${
                variant() === 'danger' ? 'border-crimson/20' : 'border-pale-gold/20'
              }`}
            >
              {props.cancelText ?? 'Cancel'}
            </button>
            <button
              onClick={props.onConfirm}
              disabled={props.loading}
              class={`flex-1 font-orbitron text-[0.7rem] uppercase tracking-[0.2em] transition-all duration-200 disabled:opacity-50 ${
                variant() === 'danger'
                  ? 'text-crimson hover:bg-crimson/10 hover:[text-shadow:0_0_8px_var(--color-crimson)]'
                  : 'text-pale-gold hover:bg-pale-gold/10 hover:[text-shadow:0_0_8px_rgba(212,175,55,0.5)]'
              }`}
            >
              {props.loading ? '...' : props.confirmText ?? 'Confirm'}
            </button>
          </div>
        </div>
      </div>
    </Show>
  )
}
