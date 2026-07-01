'use client'

import { useIsFetching, useIsMutating } from '@tanstack/react-query'

export function GlobalNetworkIndicator() {
    const isFetching = useIsFetching()
    const isMutating = useIsMutating()
    
    const isBusy = isFetching > 0 || isMutating > 0

    if (!isBusy) return null

    return (
        <div className="fixed top-0 left-0 w-full h-1 bg-slate-100 z-50 overflow-hidden">
        <div className="h-full bg-blue-600 animate-pulse w-full"></div>
        </div>
    )
}