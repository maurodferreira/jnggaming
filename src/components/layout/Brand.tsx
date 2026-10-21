import { Link } from '@tanstack/react-router'

export function Brand() {
  return (
    <Link to="/" search={{ q: '', collection: 'all', available: false, sort: 'featured', page: 1 }} className="font-bold tracking-[0.18em]">KURIO</Link>
  )
}
