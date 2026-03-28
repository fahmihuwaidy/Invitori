import React, { useState, useEffect } from 'react'
import staticImg from '../assets/Static.png'

const ComingSoon = ({ children }) => {
  const [isVisible, setIsVisible] = useState(true)
  const [offset, setOffset] = useState({ x: 0, y: 0 })

  useEffect(() => {
    if (window.location.search.includes('preview=true')) {
      setIsVisible(false)
      return
    }

    let keySequence = ''

    const handleKeyDown = (e) => {
      // Allow sequence of < then >
      keySequence += e.key
      if (keySequence.includes('<>')) {
        setIsVisible(false)
      }

      // Keep string short to avoid memory leak
      if (keySequence.length > 5) {
        keySequence = keySequence.slice(-5)
      }
    }

    const handleMouseMove = (e) => {
      // Calculate offset based on mouse position (center is 0,0)
      // Multilpy by factor to adjust the intensity of the effect
      const x = (e.clientX / window.innerWidth - 0.5) * 30
      const y = (e.clientY / window.innerHeight - 0.5) * 30
      setOffset({ x, y })
    }

    window.addEventListener('keydown', handleKeyDown)
    if (isVisible) {
      window.addEventListener('mousemove', handleMouseMove)
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [isVisible])

  if (!isVisible) {
    return <>{children}</>
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      zIndex: 999999, // Ensure it's above everything
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
      backgroundColor: '#0a0a0a' // Dark base
    }}>
      {/* Parallax Background */}
      <div style={{
        position: 'absolute',
        top: '-5%', // Extra size to prevent edges showing on translation
        left: '-5%',
        width: '110%',
        height: '110%',
        backgroundImage: `url(${staticImg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        transform: `translate(calc(${offset.x}px), calc(${offset.y}px))`,
        transition: 'transform 0.1s cubic-bezier(0.25, 0.46, 0.45, 0.94)', // Smooth following
        opacity: 0.6,
        zIndex: 1
      }}></div>

      {/* Content */}
      <div style={{
        position: 'relative',
        zIndex: 2,
        textAlign: 'center',
        color: '#ffffff',
        padding: '0 20px',
        pointerEvents: 'none' // Let mouse events pass through to body if needed (or not, since it covers all)
      }}>
        <h1 style={{
          fontSize: 'clamp(3rem, 10vw, 8rem)',
          fontFamily: 'var(--font-display)',
          fontWeight: 400,
          textTransform: 'none',
          letterSpacing: '0.02em',
          margin: 0,
          textShadow: '0 10px 40px rgba(0,0,0,0.8)'
        }}>
          Inviting Soon!
        </h1>
        <p className="serif-italic" style={{
          fontSize: 'clamp(1rem, 2.5vw, 1.5rem)',
          marginTop: '1.5rem',
          letterSpacing: '0.05em',
          opacity: 0.9,
          textShadow: '0 4px 15px rgba(0,0,0,0.6)'
        }}>
          A new journey is about to begin
        </p>
      </div>
    </div>
  )
}

export default ComingSoon
