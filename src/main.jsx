import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

import './index.css'
import App from './App.jsx'
import AnimalPage from './AnimalPage.jsx'
import ApplyPage from './ApplyPage.jsx'
import AnimalsCatalogPage from './AnimalsCatalogPage.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/animals" element={<AnimalsCatalogPage />} />
        <Route path="/animal/:id" element={<AnimalPage />} />
        <Route path="/apply/:id" element={<ApplyPage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
)
