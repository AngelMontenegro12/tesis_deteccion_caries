const STORAGE_PREFIX = 'sonrie_preferences';

export const DEFAULT_PREFERENCES = {
  sidebarOpen: true,
};

const getStorageKey = () => {
  try {
    const saved = localStorage.getItem('user');
    const user = saved ? JSON.parse(saved) : null;
    return user?.id_odontologo
      ? `${STORAGE_PREFIX}_${user.id_odontologo}`
      : `${STORAGE_PREFIX}_guest`;
  } catch {
    return `${STORAGE_PREFIX}_guest`;
  }
};

export const getPreferences = () => {
  try {
    const raw = localStorage.getItem(getStorageKey());
    if (!raw) return { ...DEFAULT_PREFERENCES };
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return { ...DEFAULT_PREFERENCES };
    return { ...DEFAULT_PREFERENCES, ...parsed };
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
};

export const savePreferences = (partial) => {
  const next = { ...getPreferences(), ...partial };
  try {
    localStorage.setItem(getStorageKey(), JSON.stringify(next));
  } catch {
    return next;
  }
  window.dispatchEvent(new CustomEvent('preferences:changed', { detail: next }));
  return next;
};
