import type { UseFormRegister, FieldValues, Path } from 'react-hook-form'
import { Field, Select } from '@/components/ui/Input'
import type { Visibility } from '@/utils/visibility'

export function VisibilityField<T extends FieldValues>({
  value,
  onChange,
  register,
  name = 'visibility' as Path<T>,
}: {
  value?: Visibility
  onChange?: (v: Visibility) => void
  register?: UseFormRegister<T>
  name?: Path<T>
}) {
  if (register) {
    return (
      <Field label="Visible para">
        <Select {...register(name)}>
          <option value="family">Toda la familia</option>
          <option value="private">Solo yo (y el responsable si hay)</option>
        </Select>
      </Field>
    )
  }

  return (
    <Field label="Visible para">
      <Select
        value={value ?? 'family'}
        onChange={(e) => onChange?.(e.target.value as Visibility)}
      >
        <option value="family">Toda la familia</option>
        <option value="private">Solo yo (y el responsable si hay)</option>
      </Select>
    </Field>
  )
}

export function VisibilityBadge({ visibility }: { visibility?: string | null }) {
  const isPrivate = visibility === 'private'
  return (
    <span
      className={`inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-medium ${
        isPrivate
          ? 'bg-[var(--color-warm-soft)] text-[var(--color-warm)]'
          : 'bg-[var(--color-accent-soft)] text-[var(--color-accent-strong)]'
      }`}
    >
      {isPrivate ? 'Solo yo' : 'Familia'}
    </span>
  )
}
