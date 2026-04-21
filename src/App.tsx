import DinoGame from './DinoGame'
import './App.css'

function App() {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f7f7f7' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <DinoGame />
      </div>
    </div>
  )
}

export default App
