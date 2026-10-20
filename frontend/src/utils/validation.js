// Utilidades de validación básica reutilizables en los formularios

export const isNotEmpty = (value) => String(value ?? '').trim().length > 0;

export const hasMinLength = (value, min) => String(value ?? '').trim().length >= min;

// Nombres/apellidos: al menos 2 caracteres
export const isValidName = (value) => hasMinLength(value, 2);

// Correo electrónico
export const isValidEmail = (value) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value ?? '').trim());

export const onlyDniDigits = (value) => String(value ?? '').replace(/\D/g, '').slice(0, 8);

// Celular peruano: 9 dígitos y comienza en 9
export const isValidPhone = (value) => /^9[0-9]{8}$/.test(String(value ?? '').trim());

export const phoneError = (value, label = 'El teléfono', required = true) => {
  if (!String(value ?? '').trim() && !required) return '';
  if (!String(value ?? '').trim()) return `${label} es requerido (9 dígitos y debe empezar en 9)`;
  return isValidPhone(value) ? '' : `${label} debe tener 9 dígitos y empezar en 9`;
};

// DNI peruano: exactamente 8 dígitos
export const isValidDni = (value) => /^[0-9]{8}$/.test(String(value ?? '').trim());

export const todayLocal = () => {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
};

export const isValidDate = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value ?? ''))) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day &&
    value >= '1900-01-01' && value <= todayLocal();
};

export const calculateAge = (birthDate) => {
  if (!isValidDate(birthDate)) return null;
  const [year, month, day] = birthDate.split('-').map(Number);
  const today = new Date();
  return today.getFullYear() - year - (
    today.getMonth() + 1 < month || (today.getMonth() + 1 === month && today.getDate() < day) ? 1 : 0
  );
};

// Contraseña: mínimo 6 caracteres
export const isValidPassword = (value) => hasMinLength(value, 6);
