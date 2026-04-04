'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCarrinhoGarcomStore } from '@/stores/carrinho-garcom'

/**
 * Polling de atualização da aba do garçom.
 *
 * - Chama `router.refresh()` a cada `intervalMs` milissegundos.
 * - Pausa automaticamente quando:
 *   - `document.hidden` (aba em background)
 *   - `activeModal !== null` (modal ou drawer aberto — evita refresh durante interação)
 * - Ao voltar para a aba, dispara refresh imediato antes de retomar o intervalo.
 */
export function useTabPolling(mesaId: string, intervalMs = 10_000) {
  const router = useRouter()
  const activeModal = useCarrinhoGarcomStore((state) => state.activeModal)

  useEffect(() => {
    // Polling suspenso enquanto houver modal/drawer aberto
    if (activeModal !== null) return

    let timer: ReturnType<typeof setInterval> | null = null

    const startPolling = () => {
      if (timer !== null) return
      timer = setInterval(() => {
        router.refresh()
      }, intervalMs)
    }

    const stopPolling = () => {
      if (timer !== null) {
        clearInterval(timer)
        timer = null
      }
    }

    const handleVisibility = () => {
      if (document.hidden) {
        stopPolling()
      } else {
        // Refresh imediato ao voltar para a aba, depois retoma intervalo
        router.refresh()
        startPolling()
      }
    }

    document.addEventListener('visibilitychange', handleVisibility)

    // Inicia polling se a aba já estiver visível
    if (!document.hidden) {
      startPolling()
    }

    return () => {
      stopPolling()
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [mesaId, intervalMs, router, activeModal])
}
