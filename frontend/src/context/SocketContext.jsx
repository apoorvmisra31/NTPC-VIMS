import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext'

const SocketContext = createContext()

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null)
  const [notifications, setNotifications] = useState([])
  const [isConnected, setIsConnected] = useState(false)
  const { user } = useAuth()
  const retryCountRef = useRef(0)
  const maxRetries = 10
  const reconnectTimerRef = useRef(null)

  useEffect(() => {
    if (!user) return

    const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:5001', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: maxRetries,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 30000,
      randomizationFactor: 0.5,
      timeout: 20000,
    })

    newSocket.on('connect', () => {
      console.log('[Socket] Connected:', newSocket.id)
      setIsConnected(true)
      retryCountRef.current = 0

      // Re-join user room on reconnect
      if (user?.id) {
        newSocket.emit('join', user.id)
      }
    })

    newSocket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason)
      setIsConnected(false)
    })

    newSocket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`[Socket] Reconnect attempt #${attemptNumber}`)
      retryCountRef.current = attemptNumber
    })

    newSocket.on('reconnect', (attemptNumber) => {
      console.log(`[Socket] Reconnected after ${attemptNumber} attempts`)
      setIsConnected(true)
      retryCountRef.current = 0
    })

    newSocket.on('reconnect_failed', () => {
      console.error('[Socket] Reconnection failed after max retries')
      setIsConnected(false)
    })

    newSocket.on('connect_error', (err) => {
      console.warn('[Socket] Connection error:', err.message)
    })

    // Join user room for notifications
    newSocket.emit('join', user.id)

    newSocket.on('notification', (notification) => {
      setNotifications(prev => [notification, ...prev])
    })

    setSocket(newSocket)

    return () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current)
      }
      newSocket.close()
    }
  }, [user])

  return (
    <SocketContext.Provider value={{ socket, notifications, setNotifications, isConnected }}>
      {children}
    </SocketContext.Provider>
  )
}

export const useSocket = () => useContext(SocketContext)
