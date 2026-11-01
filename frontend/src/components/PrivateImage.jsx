import { useEffect, useState } from 'react';
import api from '../services/api';

// Las imágenes clínicas no pueden cargarse con <img src="/uploads/...">: no envía Bearer.
export default function PrivateImage({ src, onError, ...props }) {
  const [resolved, setResolved] = useState('');

  useEffect(() => {
    if (!src) { setResolved(''); return undefined; }
    let url;
    try { url = new URL(src, api.defaults.baseURL); } catch { setResolved(''); return undefined; }
    const privateFile = url.pathname.startsWith('/uploads/');
    if (!privateFile) { setResolved(src); return undefined; }
    const base = new URL(api.defaults.baseURL);
    if (url.protocol !== base.protocol || url.port !== base.port ||
        !['localhost', '127.0.0.1'].includes(url.hostname)) {
      setResolved('');
      return undefined;
    }
    let active = true;
    let objectUrl;
    setResolved('');
    api.get(url.href, { responseType: 'blob' }).then(({ data }) => {
      if (!active) return;
      objectUrl = URL.createObjectURL(data);
      setResolved(objectUrl);
    }).catch(() => { if (active) setResolved(''); });
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src]);

  return <img src={resolved || undefined} onError={onError} {...props} />;
}
