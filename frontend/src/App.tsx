import { Routes, Route, Navigate } from 'react-router-dom'
import UploadPage from './pages/UploadPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/upload" replace />} />
      <Route path="/upload" element={<UploadPage />} />
    </Routes>
  )
}

export default App
