export const safeStorage = {
  get(key: string): any {
    if (typeof window === 'undefined') return null;

    const value = localStorage.getItem(key);
    if (!value) return null;

    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  },

  set(key: string, value: any): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(value));
  },

  remove(key: string): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(key);
  }
};
