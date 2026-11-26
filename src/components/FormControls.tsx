import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'

interface FieldShellProps {
  label: string
  error?: string
  hint?: string
  className?: string
  children: (ids: { id: string; describedBy?: string }) => ReactNode
}

/** Label + control + error message, wired together for screen readers. */
function FieldShell({ label, error, hint, className = '', children }: FieldShellProps) {
  const id = useId()
  const errorId = `${id}-error`
  const hintId = `${id}-hint`
  const describedBy = [hint && hintId, error && errorId].filter(Boolean).join(' ') || undefined
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <label htmlFor={id} className="text-[13px] font-medium">{label}</label>
      {children({ id, describedBy })}
      {hint && <p id={hintId} className="text-xs text-espresso/70">{hint}</p>}
      {error && <p id={errorId} className="field-error" role="alert">{error}</p>}
    </div>
  )
}

type Common = { label: string; error?: string; hint?: string; className?: string }

export function TextField({ label, error, hint, className, ...rest }: Common & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <FieldShell label={label} error={error} hint={hint} className={className}>
      {({ id, describedBy }) => (
        <input id={id} aria-invalid={!!error} aria-describedby={describedBy} className="field" {...rest} />
      )}
    </FieldShell>
  )
}

export function TextArea({ label, error, hint, className, ...rest }: Common & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <FieldShell label={label} error={error} hint={hint} className={className}>
      {({ id, describedBy }) => (
        <textarea id={id} aria-invalid={!!error} aria-describedby={describedBy} className="field resize-y py-3" {...rest} />
      )}
    </FieldShell>
  )
}

export function SelectField({
  label,
  error,
  hint,
  className,
  options,
  placeholder,
  ...rest
}: Common & SelectHTMLAttributes<HTMLSelectElement> & { options: readonly string[]; placeholder?: string }) {
  return (
    <FieldShell label={label} error={error} hint={hint} className={className}>
      {({ id, describedBy }) => (
        <select id={id} aria-invalid={!!error} aria-describedby={describedBy} className="field" {...rest}>
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      )}
    </FieldShell>
  )
}

/** Hidden field that real people never fill in; bots often do. */
export function Honeypot({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
      <label>
        Leave this field empty
        <input tabIndex={-1} autoComplete="off" value={value} onChange={(e) => onChange(e.target.value)} name="website" />
      </label>
    </div>
  )
}
