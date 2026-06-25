import { useEffect, useRef, useState } from 'react'
import * as signalR from '@microsoft/signalr'
import type { AlertDto } from '../types'

export function useAlertHub(onNewAlert?: (alert: AlertDto) => void) {
  const connectionRef = useRef<signalR.HubConnection | null>(null)
  const [connected, setConnected] = useState(false)
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return

    let stopped = false

    const connect = () => {
      if (stopped) return

      const connection = new signalR.HubConnectionBuilder()
        .withUrl(import.meta.env.VITE_ALERT_HUB_URL || '/hubs/alerts', {
          accessTokenFactory: () => token,
        })
        .withAutomaticReconnect([2000, 5000, 10000, 30000])
        .configureLogging(signalR.LogLevel.Error)
        .build()

      connection.on('NewAlert', (alert: AlertDto) => {
        onNewAlert?.(alert)
      })

      connection.onclose(() => {
        setConnected(false)
        if (!stopped) {
          retryRef.current = setTimeout(connect, 15000)
        }
      })

      connection.onreconnected(() => setConnected(true))
      connection.onreconnecting(() => setConnected(false))

      connection.start()
        .then(() => setConnected(true))
        .catch(() => {
          if (!stopped) {
            retryRef.current = setTimeout(connect, 10000)
          }
        })

      connectionRef.current = connection
    }

    connect()

    return () => {
      stopped = true
      if (retryRef.current) clearTimeout(retryRef.current)
      connectionRef.current?.stop().catch(() => {})
    }
  }, [onNewAlert])

  return { connected }
}
