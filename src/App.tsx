import { useEffect } from 'react'
import { AppLayout } from './presentation/layout/AppLayout'

function App() {
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return <AppLayout />
}

export default App
