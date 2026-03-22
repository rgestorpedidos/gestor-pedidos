import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { StoreConfig, BusinessHour } from '@/types/database'
import { isStoreOpenNow } from '@/lib/checkStoreOpen'

export type StoreWithHours = StoreConfig & {
    business_hours?: BusinessHour[]
}

export function useStore() {
    const [store, setStore] = useState<StoreWithHours | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Derived state
    const isCurrentlyOpen = useMemo(() => {
        if (!store) return false;
        return isStoreOpenNow(
            store.auto_schedule_enabled,
            store.is_open,
            store.business_hours || []
        );
    }, [store]);

    const fetchStore = async () => {
        try {
            setLoading(true)
            const supabase = createClient()

            // Get current user first
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                setError('Usuário não autenticado')
                return
            }

            // Fetch store with business_hours and their periods
            // CRITICAL: Filter by user.id to ensure isolation
            const { data, error } = await supabase
                .from('store_config')
                .select(`
                    *,
                    business_hours (
                        *,
                        periods:business_hour_periods (*)
                    )
                `)
                .eq('id', user.id) // Store ID = User ID by design
                .single()

            if (error) throw error

            // Sort business_hours by day (just in case)?? 
            // Better to handle that in UI, but good to ensure data integrity here if needed.
            // Supabase returns relations as array.

            setStore(data)
        } catch (err) {
            console.error('Erro ao carregar loja:', JSON.stringify(err, null, 2))
            setError('Erro ao carregar dados da loja')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchStore()
    }, [])

    return { store, loading, error, fetchStore, setStore, isCurrentlyOpen }
}
