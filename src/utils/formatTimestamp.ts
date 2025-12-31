export function formatTimestamp(isoString: string) {
    const date = new Date(isoString);
    const now = new Date();

    const isToday =
        date.getDate() === now.getDate() &&
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear();

    const time = date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });

    if (isToday) {
        return time;
    }

    const day = date.toLocaleDateString([], {
        day: '2-digit',
        month: 'short',
    });

    return `${day} · ${time}`;
}
