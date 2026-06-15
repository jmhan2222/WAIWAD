import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { LibraryPage } from './pages/LibraryPage'
import { StudyPage } from './pages/StudyPage'

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<LibraryPage />} />
          <Route path="/study/:id" element={<StudyPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}
