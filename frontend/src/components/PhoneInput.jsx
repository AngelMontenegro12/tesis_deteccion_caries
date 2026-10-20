import React from 'react';

// Formatea un número peruano de 9 dígitos como "999 999 999"
export const formatPhone = (value) => {
  const digits = String(value ?? '').replace(/\D/g, '').slice(0, 9);
  return digits.replace(/(\d{3})(?=\d)/g, '$1 ');
};

// Deja únicamente los dígitos, limitado a 9
export const onlyDigits = (value) => String(value ?? '').replace(/\D/g, '').slice(0, 9);

const PhoneInput = ({
  name,
  value,
  onChange,
  className = '',
  placeholder = '999 999 999',
  disabled = false,
  id,
  ...rest
}) => {
  const digits = onlyDigits(value);

  const handleChange = (event) => {
    const soloDigitos = onlyDigits(event.target.value);
    // Se emula el evento nativo para reutilizar los manejadores existentes
    if (onChange) {
      onChange({ target: { name, value: soloDigitos } });
    }
  };

  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm select-none">
        +51
      </span>
      <input
        {...rest}
        id={id}
        type="tel"
        inputMode="numeric"
        autoComplete="tel"
        name={name}
        value={formatPhone(digits)}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={11}
        style={{ paddingLeft: '2.9rem' }}
        className={className}
      />
    </div>
  );
};

export default PhoneInput;
