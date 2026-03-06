import { useState, useEffect, useRef } from 'react'

export function useApi(fetchFn, deps = []) {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        let cancelled = false
        setLoading(true)
        fetchFn()
            .then(json => { if (!cancelled) { setData(json); setError(null) } })
            .catch(err => { if (!cancelled) setError(err) })
            .finally(() => { if (!cancelled) setLoading(false) })
        return () => { cancelled = true }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps)

    return { data, loading, error }
}

export function usePolling(fetchFn, intervalMs = 30000) {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const fnRef = useRef(fetchFn)
    fnRef.current = fetchFn

    useEffect(() => {
        let cancelled = false

        async function load() {
            const json = await fnRef.current()
            if (cancelled) return
            if (json) setData(json)
            setLoading(false)
        }

        load()
        const id = setInterval(load, intervalMs)
        return () => { cancelled = true; clearInterval(id) }
    }, [intervalMs])

    return { data, loading }
}
