class Storage {
    static read<T>(key: string): T|null {
        try {
            return JSON.parse(localStorage.getItem(key) || '') as unknown as T;
        } catch (e) {
            return null;
        }

    }

    static write(key: string, obj: unknown): void {
        localStorage.setItem(key, JSON.stringify(obj || ''));
    }

    static reset(): void {
        localStorage.clear();
    }
}

export default Storage;

