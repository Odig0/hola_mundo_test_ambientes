import { useEffect, useRef, useState, useCallback } from 'react'

const GROUND_Y = 220
const DINO_WIDTH = 44
const DINO_HEIGHT = 52
const CACTUS_WIDTH = 24
const CACTUS_HEIGHT = 50
const GRAVITY = 0.6
const JUMP_FORCE = -14
const INITIAL_SPEED = 3
const CANVAS_WIDTH = 700
const CANVAS_HEIGHT = 280

type GameState = 'idle' | 'running' | 'dead'

interface Cactus {
  x: number
  width: number
  height: number
}

interface Cloud {
  x: number
  y: number
}

function drawDino(ctx: CanvasRenderingContext2D, x: number, y: number, frame: number, isDead: boolean) {
  ctx.fillStyle = '#535353'

  // Body
  ctx.fillRect(x + 6, y, 32, 34)
  // Head
  ctx.fillRect(x + 20, y - 18, 24, 20)
  // Eye
  ctx.fillStyle = '#fff'
  ctx.fillRect(x + 36, y - 14, 6, 6)
  ctx.fillStyle = '#535353'
  ctx.fillRect(x + 38, y - 12, 3, 3)

  if (isDead) {
    // X eyes
    ctx.fillStyle = '#fff'
    ctx.fillRect(x + 34, y - 14, 8, 6)
    ctx.fillStyle = '#535353'
    ctx.fillRect(x + 34, y - 14, 3, 2)
    ctx.fillRect(x + 39, y - 12, 3, 2)
    ctx.fillRect(x + 36, y - 12, 2, 4)
  }

  // Tail
  ctx.fillStyle = '#535353'
  ctx.fillRect(x, y + 10, 10, 8)
  ctx.fillRect(x - 6, y + 16, 8, 6)

  // Arms
  ctx.fillRect(x + 26, y + 14, 10, 6)

  // Legs (animated)
  if (!isDead) {
    if (frame % 2 === 0) {
      ctx.fillRect(x + 12, y + 34, 10, 16)
      ctx.fillRect(x + 12, y + 50, 14, 6)
      ctx.fillRect(x + 22, y + 34, 10, 10)
      ctx.fillRect(x + 18, y + 44, 14, 6)
    } else {
      ctx.fillRect(x + 12, y + 34, 10, 10)
      ctx.fillRect(x + 8, y + 44, 14, 6)
      ctx.fillRect(x + 22, y + 34, 10, 16)
      ctx.fillRect(x + 22, y + 50, 14, 6)
    }
  } else {
    ctx.fillRect(x + 12, y + 34, 10, 14)
    ctx.fillRect(x + 22, y + 34, 10, 14)
  }
}

function drawCactus(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.fillStyle = '#535353'
  // Main trunk
  ctx.fillRect(x + w / 2 - 5, y, 10, h)
  // Left arm
  ctx.fillRect(x, y + h * 0.3, w / 2 - 2, 8)
  ctx.fillRect(x, y + h * 0.1, 8, h * 0.25)
  // Right arm
  ctx.fillRect(x + w / 2 + 2, y + h * 0.4, w / 2 - 2, 8)
  ctx.fillRect(x + w - 8, y + h * 0.2, 8, h * 0.25)
}

function drawCloud(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = '#d0d0d0'
  ctx.beginPath()
  ctx.arc(x + 20, y + 10, 12, 0, Math.PI * 2)
  ctx.arc(x + 36, y + 6, 16, 0, Math.PI * 2)
  ctx.arc(x + 52, y + 10, 12, 0, Math.PI * 2)
  ctx.fill()
}

export default function DinoGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef({
    gameState: 'idle' as GameState,
    dinoY: GROUND_Y - DINO_HEIGHT,
    dinoVY: 0,
    onGround: true,
    cacti: [] as Cactus[],
    clouds: [{ x: 100, y: 40 }, { x: 400, y: 20 }] as Cloud[],
    speed: INITIAL_SPEED,
    score: 0,
    frame: 0,
    nextCactus: 80,
    groundX: 0,
    animFrame: 0,
  })
  const rafRef = useRef<number>(0)
  const [display, setDisplay] = useState({ score: 0, state: 'idle' as GameState })

  const jump = useCallback(() => {
    const s = stateRef.current
    if (s.gameState === 'idle') {
      s.gameState = 'running'
      setDisplay(d => ({ ...d, state: 'running' }))
    }
    if (s.gameState === 'running' && s.onGround) {
      s.dinoVY = JUMP_FORCE
      s.onGround = false
    }
    if (s.gameState === 'dead') {
      s.gameState = 'idle'
      s.dinoY = GROUND_Y - DINO_HEIGHT
      s.dinoVY = 0
      s.onGround = true
      s.cacti = []
      s.speed = INITIAL_SPEED
      s.score = 0
      s.frame = 0
      s.nextCactus = 80
      s.groundX = 0
      s.clouds = [{ x: 100, y: 40 }, { x: 400, y: 20 }]
      setDisplay({ score: 0, state: 'idle' })
    }
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault()
        jump()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [jump])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!

    function loop() {
      const s = stateRef.current

      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

      // Sky
      ctx.fillStyle = '#f7f7f7'
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

      // Clouds
      for (const cloud of s.clouds) {
        drawCloud(ctx, cloud.x, cloud.y)
        if (s.gameState === 'running') cloud.x -= s.speed * 0.3
        if (cloud.x < -80) cloud.x = CANVAS_WIDTH + 20
      }

      // Ground
      ctx.fillStyle = '#535353'
      ctx.fillRect(0, GROUND_Y + DINO_HEIGHT, CANVAS_WIDTH, 3)

      // Ground texture
      s.groundX -= s.gameState === 'running' ? s.speed : 0
      if (s.groundX < -40) s.groundX += 40
      ctx.fillStyle = '#aaa'
      for (let i = 0; i < CANVAS_WIDTH / 40 + 1; i++) {
        ctx.fillRect(s.groundX + i * 40, GROUND_Y + DINO_HEIGHT + 6, 20, 2)
      }

      if (s.gameState === 'running') {
        // Physics
        s.dinoVY += GRAVITY
        s.dinoY += s.dinoVY
        if (s.dinoY >= GROUND_Y - DINO_HEIGHT) {
          s.dinoY = GROUND_Y - DINO_HEIGHT
          s.dinoVY = 0
          s.onGround = true
        }

        // Spawn cacti
        s.nextCactus--
        if (s.nextCactus <= 0) {
          const h = CACTUS_HEIGHT + Math.random() * 20
          s.cacti.push({ x: CANVAS_WIDTH, width: CACTUS_WIDTH, height: h })
          s.nextCactus = 60 + Math.random() * 60
        }

        // Move cacti & collision
        for (let i = s.cacti.length - 1; i >= 0; i--) {
          s.cacti[i].x -= s.speed

          // Collision (tighter hitbox)
          const cx = s.cacti[i].x + 4
          const cy = GROUND_Y + DINO_HEIGHT - s.cacti[i].height
          const cw = s.cacti[i].width - 8
          const ch = s.cacti[i].height
          const dx = 54
          const dy = s.dinoY
          if (
            dx < cx + cw &&
            dx + DINO_WIDTH - 20 > cx &&
            dy < cy + ch &&
            dy + DINO_HEIGHT > cy
          ) {
            s.gameState = 'dead'
            setDisplay(d => ({ ...d, state: 'dead' }))
          }

          if (s.cacti[i].x < -60) s.cacti.splice(i, 1)
        }

        s.score++
        s.speed = INITIAL_SPEED + s.score / 500
        s.frame++
        s.animFrame = Math.floor(s.frame / 8)

        if (s.frame % 6 === 0) {
          setDisplay({ score: Math.floor(s.score / 6), state: 'running' })
        }
      }

      // Draw cacti
      for (const c of s.cacti) {
        drawCactus(ctx, c.x, GROUND_Y + DINO_HEIGHT - c.height, c.width + 10, c.height)
      }

      // Draw dino
      drawDino(ctx, 50, s.dinoY, s.animFrame, s.gameState === 'dead')

      // Overlay messages
      if (s.gameState === 'idle') {
        ctx.fillStyle = '#535353'
        ctx.font = 'bold 18px monospace'
        ctx.textAlign = 'center'
        ctx.fillText('Presiona ESPACIO o toca para saltar', CANVAS_WIDTH / 2, 130)
        ctx.font = '14px monospace'
        ctx.fillText('¡Evita los cactus!', CANVAS_WIDTH / 2, 155)
      }

      if (s.gameState === 'dead') {
        ctx.fillStyle = '#535353'
        ctx.font = 'bold 22px monospace'
        ctx.textAlign = 'center'
        ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, 120)
        ctx.font = '15px monospace'
        ctx.fillText('Presiona ESPACIO o toca para reiniciar', CANVAS_WIDTH / 2, 148)
      }

      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', width: CANVAS_WIDTH, padding: '0 4px', boxSizing: 'border-box' }}>
        <span style={{ fontFamily: 'monospace', color: '#535353', fontSize: 16 }}>
          🦕 Dino Jump
        </span>
        <span style={{ fontFamily: 'monospace', color: '#535353', fontSize: 16, fontWeight: 'bold' }}>
          SCORE: {String(display.score).padStart(5, '0')}
        </span>
      </div>
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        style={{
          border: '2px solid #535353',
          borderRadius: 8,
          cursor: 'pointer',
          background: '#f7f7f7',
          display: 'block',
        }}
        onClick={jump}
        onTouchStart={(e) => { e.preventDefault(); jump() }}
      />
      <p style={{ fontFamily: 'monospace', color: '#888', fontSize: 13, margin: 0 }}>
        ↑ / Espacio / Toque para saltar
      </p>
    </div>
  )
}
