import { HashRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import SingleNoteTraining from './pages/SingleNoteTraining'
import ChordTraining from './pages/ChordTraining'
import ChordIdentification from './pages/ChordIdentification'

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="single-note" element={<SingleNoteTraining />} />
          <Route path="chord-training" element={<ChordTraining />} />
          <Route path="chord-id" element={<ChordIdentification />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
