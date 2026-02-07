export const useHome = () => {
    const config = useRuntimeConfig()

    const getAssetsSummary = async () => {
        const data = await useFetch('/assets/summary', {
            method: 'GET',
            baseURL: config.public.backendUrl,
            credentials: 'include'
        })
        return data
    }

    const getAssetsByCategory = async (category: string) => {
        let url = `/assets?filter=category&filter_value=${category}`
        const data = await useFetch(url, {
            method: 'GET',
            baseURL: config.public.backendUrl,
            credentials: 'include'
        })
        return data
    }

    const getAssetsCountByCategory = async (category?: string) => {
        let url = '/assets/category/count'
        if (category) {
            url += `/${category}/count`
        }
        const data = await useFetch(url, {
            method: 'GET',
            baseURL: config.public.backendUrl,
            credentials: 'include'
        })
        return data
    }

    const getPendingApprovals = async () => {
        const data = await useFetch('/requests?filter=status&filterValue=PENDING', {
            method: 'GET',
            baseURL: config.public.backendUrl,
            credentials: 'include'
        })
        return data
    }

    const getRecentActivities = async () => {
        // const data = await useFetch('/activities/recent', {
        //     method: 'GET',
        //     baseURL: config.public.backendUrl,
        //     credentials: 'include'
        // })
        // TODO: Implements activities
        // mock data for now
        const data = {
            recentActivities: [
                {asset_name: 'Laptop Dell XPS 13', event_type: 'borrowed', actor_name: 'john_doe', occurred_at: '2024-06-01 10:00'},
                {asset_name: 'MacBook Pro 16', event_type: 'returned', actor_name: 'alice', occurred_at: '2024-06-01 12:30'},
                {asset_name: 'Monitor LG 27-inch', event_type: 'maintenance', actor_name: 'bob_smith', occurred_at: '2024-06-02 09:15'},
                {asset_name: 'iPad Air', event_type: 'borrowed', actor_name: 'carol', occurred_at: '2024-06-02 14:45'},
                {asset_name: 'Keyboard Keychron K2', event_type: 'returned', actor_name: 'dave', occurred_at: '2024-06-03 11:20'},
                {asset_name: 'Docking Station USB-C', event_type: 'borrowed', actor_name: 'eve', occurred_at: '2024-06-03 16:05'},
            ]
        }
        return data
    }

    const getAuditLogs = async () => {
        // const data = await useFetch('/audit-logs/recent', {
        //     method: 'GET',
        //     baseURL: config.public.backendUrl,
        //     credentials: 'include'
        // })
        // TODO: Implements audit logs 
        // mock data for now
        const data = {
            auditLogs: [
                {action: 'Created asset Laptop Dell XPS 13', performed_by: 'admin', performed_at: '2024-05-30 09:00', before: '', after: 'name: Laptop Dell XPS 13, code: DELLXPS13, category: Laptop, status: READY, costs: 1200'},
                {action: 'Updated status of MacBook Pro 16 to IN_USE', performed_by: 'admin', performed_at: '2024-05-30 10:30', before: 'status: READY', after: 'status: IN_USE'},
                {action: 'Deleted asset Monitor LG 27-inch', performed_by: 'admin', performed_at: '2024-05-31 11:15', before: 'name: Monitor LG 27-inch, code: LGL27, category: Monitor, status: BROKEN, costs: 300', after: ''},
                {action: 'Created asset iPad Air', performed_by: 'admin', performed_at: '2024-05-31 14:45', before: '', after: 'name: iPad Air, code: IPADAIR, category: Tablet, status: READY, costs: 600'},
                {action: 'Updated asset Keyboard Keychron K2 details', performed_by: 'admin', performed_at: '2024-06-01 13:20', before: 'name: Keyboard Keychron K2, code: KEYK2, category: Keyboard, status: READY, costs: 100', after: 'name: Keyboard Keychron K2, code: KEYK2, category: Keyboard, status: IN_USE, costs: 100'},
                {action: 'Created asset Docking Station USB-C', performed_by: 'admin', performed_at: '2024-06-01 15:05', before: '', after: 'name: Docking Station USB-C, code: DOCKUSB, category: Docking Station, status: READY, costs: 150'},
            ]
        }
        return data
    }
    return {
        getAssetsSummary,
        getAssetsByCategory,
        getPendingApprovals,
        getRecentActivities,
        getAssetsCountByCategory,
        getAuditLogs
    }
}