import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="p-8 text-center">
      <h1 className="text-xl font-bold mb-2">Page not found</h1>
      <Link to="/" className="text-blue-600">
        Back to browsing
      </Link>
    </div>
  )
}
