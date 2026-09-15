import { useState } from 'react'
import PublicRoutes from './routes/PublicRoutes'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div>
      <PublicRoutes />
    </div>
  )
}

export default App