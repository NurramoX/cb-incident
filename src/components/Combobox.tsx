import { createSignal, createMemo, createUniqueId, For, Show } from 'solid-js'

export interface ComboboxOption {
  id: string
  label: string
}

interface ComboboxProps {
  options: ComboboxOption[]
  value: string
  onChange: (id: string) => void
  placeholder?: string
  disabled?: boolean
}

export default function Combobox(props: ComboboxProps) {
  const [query, setQuery] = createSignal('')
  const [isOpen, setIsOpen] = createSignal(false)
  const [activeIndex, setActiveIndex] = createSignal(0)

  const listboxId = createUniqueId()

  const filteredOptions = createMemo(() => {
    const q = query().toLowerCase()
    if (!q) return props.options
    return props.options.filter((opt) => opt.label.toLowerCase().includes(q))
  })

  const selectedOption = createMemo(() => {
    return props.options.find((opt) => opt.id === props.value)
  })

  const handleSelect = (option: ComboboxOption) => {
    props.onChange(option.id)
    setQuery(option.label)
    setIsOpen(false)
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    const options = filteredOptions()

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setIsOpen(true)
        setActiveIndex((i) => Math.min(i + 1, options.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setActiveIndex((i) => Math.max(i - 1, 0))
        break
      case 'Enter':
        e.preventDefault()
        if (isOpen() && options[activeIndex()]) {
          handleSelect(options[activeIndex()])
        }
        break
      case 'Escape':
        setIsOpen(false)
        break
    }
  }

  const handleFocus = () => {
    setIsOpen(true)
    // Clear query on focus to show all options, but keep display value
    if (selectedOption()) {
      setQuery('')
    }
  }

  const handleBlur = () => {
    // Delay to allow click on option
    setTimeout(() => {
      setIsOpen(false)
      // Restore selected option label if exists
      if (selectedOption()) {
        setQuery(selectedOption()!.label)
      }
    }, 150)
  }

  const handleInput = (e: InputEvent) => {
    const target = e.currentTarget as HTMLInputElement
    setQuery(target.value)
    setIsOpen(true)
    setActiveIndex(0)
    // Clear selection when typing
    if (props.value && target.value !== selectedOption()?.label) {
      props.onChange('')
    }
  }

  return (
    <div class="relative">
      <input
        type="text"
        role="combobox"
        aria-expanded={isOpen()}
        aria-controls={listboxId}
        aria-autocomplete="list"
        value={query() || selectedOption()?.label || ''}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={props.placeholder}
        disabled={props.disabled}
        class="w-full bg-dark-bg/90 border border-crimson/40 py-3 px-3.5 font-rajdhani text-base text-white outline-none transition-all duration-200 placeholder:text-white/30 focus:border-crimson focus:shadow-[0_0_15px_rgba(220,20,60,0.3)] disabled:opacity-50"
      />

      <Show when={isOpen() && filteredOptions().length > 0}>
        <ul
          id={listboxId}
          role="listbox"
          class="absolute z-50 mt-1 w-full max-h-48 overflow-auto bg-dark-bg border border-crimson/40 shadow-[0_0_15px_rgba(220,20,60,0.2)]"
        >
          <For each={filteredOptions()}>
            {(option, index) => (
              <li
                role="option"
                aria-selected={index() === activeIndex()}
                onMouseDown={() => handleSelect(option)}
                onMouseEnter={() => setActiveIndex(index())}
                class={`px-3.5 py-2.5 font-rajdhani text-base cursor-pointer transition-colors duration-150 ${
                  index() === activeIndex()
                    ? 'bg-crimson/20 text-white'
                    : 'text-white/70 hover:bg-crimson/10'
                }`}
              >
                {option.label}
              </li>
            )}
          </For>
        </ul>
      </Show>

      <Show when={isOpen() && filteredOptions().length === 0 && query()}>
        <div class="absolute z-50 mt-1 w-full bg-dark-bg border border-crimson/40 px-3.5 py-2.5 font-rajdhani text-white/50">
          No results found
        </div>
      </Show>
    </div>
  )
}
