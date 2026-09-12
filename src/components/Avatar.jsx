import { initials } from '../utils/helpers.js'

export default function Avatar({ user, size = 'md' }) {
  const cls = size === 'lg' ? 'avatar avatar-lg' : size === 'sm' ? 'avatar avatar-sm' : 'avatar'
  return (
    <span
      className={cls}
      style={{ background: user?.color || '#64748b' }}
      title={user ? `${user.firstName} ${user.lastName}` : ''}
    >
      {user ? initials(user.firstName, user.lastName) : '?'}
    </span>
  )
}