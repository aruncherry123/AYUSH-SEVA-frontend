const palette = [
  'bg-primary-light text-primary',
  'bg-blue-50 text-blue-600',
  'bg-green-50 text-green-700',
  'bg-amber-50 text-amber-700',
  'bg-purple-50 text-purple-700',
  'bg-teal-50 text-teal-700',
]

function initials(name: string) {
  const cleaned = name.replace(/^Dr\.\s*/i, '').trim()
  const parts = cleaned.split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase()
}

function colorFor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) % palette.length
  return palette[hash]
}

interface AvatarProps {
  name: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizes = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-lg',
}

export const Avatar = ({ name, size = 'md', className = '' }: AvatarProps) => (
  <span
    className={`inline-flex items-center justify-center rounded-full font-semibold shrink-0 ${sizes[size]} ${colorFor(name)} ${className}`}
    aria-hidden="true"
  >
    {initials(name)}
  </span>
)
