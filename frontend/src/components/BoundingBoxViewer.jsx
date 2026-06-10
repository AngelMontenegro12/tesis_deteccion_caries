import React, { useEffect, useMemo, useRef, useState } from 'react';

const CLASS_STYLES = {
  incipiente: {
    badge: 'border-amber-500 bg-amber-50 text-amber-800',
    box: 'border-amber-500 bg-amber-400/15',
  },
  moderada: {
    badge: 'border-orange-600 bg-orange-50 text-orange-800',
    box: 'border-orange-600 bg-orange-500/15',
  },
  avanzada: {
    badge: 'border-red-700 bg-red-50 text-red-800',
    box: 'border-red-700 bg-red-600/15',
  },
};

function getStyleBySeverity(severity) {
  return CLASS_STYLES[severity] || CLASS_STYLES.incipiente;
}

function getSeverityLabel(severity) {
  if (severity === 'moderada') {
    return 'Caries Profunda';
  }

  if (severity === 'avanzada') {
    return 'Caries Periapical (Avanzada)';
  }

  return 'Caries Incipiente';
}

function normalizeDetections(detections) {
  if (!Array.isArray(detections)) {
    return [];
  }

  return detections.filter(Boolean);
}

const BoundingBoxViewer = ({
  imageSrc,
  detections = [],
  fallbackDetections = [],
  alt = 'Radiografía',
  title,
  selectedDetectionId = null,
  onDetectionClick,
  showBoxes = true,
  showLabels = true,
  isolateSelection = false,
}) => {
  const viewportRef = useRef(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef(null);
  const allDetections = useMemo(() => {
    const source = normalizeDetections(detections);
    if (source.length > 0) {
      return source;
    }
    return normalizeDetections(fallbackDetections);
  }, [detections, fallbackDetections]);

  const handleImageLoad = (event) => {
    const { naturalWidth, naturalHeight } = event.currentTarget;
    setImageSize({ width: naturalWidth, height: naturalHeight });
  };

  useEffect(() => {
    setScale(1);
    setPan({ x: 0, y: 0 });
    setIsDragging(false);
    dragStartRef.current = null;
  }, [imageSrc]);

  const shouldShowLabels = showBoxes && showLabels;

  const clampScale = (value) => Math.min(Math.max(value, 1), 4);

  const zoomIn = () => {
    setScale((currentScale) => clampScale(Number((currentScale + 0.25).toFixed(2))));
  };

  const zoomOut = () => {
    setScale((currentScale) => {
      const nextScale = clampScale(Number((currentScale - 0.25).toFixed(2)));
      if (nextScale === 1) {
        setPan({ x: 0, y: 0 });
      }
      return nextScale;
    });
  };

  const resetView = () => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  };

  const handleWheel = (event) => {
    event.preventDefault();
    event.stopPropagation();
    const delta = event.deltaY < 0 ? 0.12 : -0.12;
    setScale((currentScale) => clampScale(Number((currentScale + delta).toFixed(2))));
    if (scale <= 1.05 && delta < 0) {
      setPan({ x: 0, y: 0 });
    }
  };

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const nativeWheel = (e) => {
      // Only intercept when pointer is inside the viewport
      if (!el.contains(e.target)) return;
      e.preventDefault();
      e.stopPropagation();
      const delta = e.deltaY < 0 ? 0.12 : -0.12;
      setScale((currentScale) => {
        const next = clampScale(Number((currentScale + delta).toFixed(2)));
        if (next <= 1.05 && delta < 0) setPan({ x: 0, y: 0 });
        return next;
      });
    };

    el.addEventListener('wheel', nativeWheel, { passive: false, capture: true });
    return () => el.removeEventListener('wheel', nativeWheel, { capture: true });
  }, [viewportRef]);

  const handlePointerDown = (event) => {
    if (event.button !== 0) {
      return;
    }

    if (event.target.closest('button[data-detection-id]')) {
      return;
    }

    dragStartRef.current = {
      x: event.clientX,
      y: event.clientY,
      panX: pan.x,
      panY: pan.y,
    };
    setIsDragging(true);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const handlePointerMove = (event) => {
    if (!isDragging || !dragStartRef.current) {
      return;
    }

    const deltaX = event.clientX - dragStartRef.current.x;
    const deltaY = event.clientY - dragStartRef.current.y;

    setPan({
      x: dragStartRef.current.panX + deltaX,
      y: dragStartRef.current.panY + deltaY,
    });
  };

  const stopDragging = (event) => {
    if (event?.currentTarget?.releasePointerCapture && event.pointerId !== undefined) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    setIsDragging(false);
    dragStartRef.current = null;
  };

  const getBoxStyle = (detection, index) => {
    const width = imageSize.width || 1;
    const height = imageSize.height || 1;

    const hasAbsoluteBox =
      Number.isFinite(detection.bbox_x) &&
      Number.isFinite(detection.bbox_y) &&
      Number.isFinite(detection.bbox_ancho) &&
      Number.isFinite(detection.bbox_alto);

    if (hasAbsoluteBox) {
      return {
        left: `${(detection.bbox_x / width) * 100}%`,
        top: `${(detection.bbox_y / height) * 100}%`,
        width: `${(detection.bbox_ancho / width) * 100}%`,
        height: `${(detection.bbox_alto / height) * 100}%`,
      };
    }

    const fallbackPositions = [
      { left: '30%', top: '28%', width: '16%', height: '18%' },
      { left: '55%', top: '42%', width: '14%', height: '16%' },
      { left: '68%', top: '20%', width: '12%', height: '15%' },
    ];

    return fallbackPositions[index % fallbackPositions.length];
  };

  const getLabelPlacementClass = (index) => {
    const placements = [
      'top-3 left-1/2 -translate-x-1/2 -translate-y-full',
      'bottom-3 left-1/2 -translate-x-1/2 translate-y-full',
      'left-3 top-1/2 -translate-x-full -translate-y-1/2',
      'right-3 top-1/2 translate-x-full -translate-y-1/2',
    ];

    return placements[index % placements.length];
  };

  const getLabelAnchorClass = (index) => {
    const placements = [
      'origin-bottom',
      'origin-top',
      'origin-right',
      'origin-left',
    ];

    return placements[index % placements.length];
  };

  return (
    <div className="relative rounded-xl overflow-hidden bg-slate-100 shadow-inner w-full border border-gray-100 min-h-[400px] group">
      <div className="absolute inset-x-0 top-0 z-30 flex items-center justify-between gap-3 p-3 pointer-events-none">
        {title ? (
          <div className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full border border-gray-200 text-xs font-bold text-slate-700 shadow-sm pointer-events-auto">
            {title}
          </div>
        ) : <div />}

        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            type="button"
            onClick={zoomOut}
            className="px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-sm border border-gray-200 text-xs font-bold text-gray-700 shadow-sm hover:bg-white"
            title="Alejar"
          >
            -
          </button>
          <span className="px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-sm border border-gray-200 text-xs font-bold text-gray-700 shadow-sm min-w-[64px] text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            type="button"
            onClick={zoomIn}
            className="px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-sm border border-gray-200 text-xs font-bold text-gray-700 shadow-sm hover:bg-white"
            title="Acercar"
          >
            +
          </button>
          <button
            type="button"
            onClick={resetView}
            className="px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-sm border border-gray-200 text-xs font-bold text-gray-700 shadow-sm hover:bg-white"
            title="Restablecer"
          >
            1:1
          </button>
        </div>
      </div>

      <div
        ref={viewportRef}
        className={`relative w-full h-full min-h-[400px] flex items-center justify-center ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        onWheelCapture={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={stopDragging}
        onPointerLeave={stopDragging}
        onPointerCancel={stopDragging}
        style={{ touchAction: 'none' }}
      >
        <div
          className="relative transition-transform duration-75 ease-out origin-center"
          style={{
            transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${scale})`,
          }}
        >
          <img
            src={imageSrc}
            alt={alt}
            onLoad={handleImageLoad}
            className="max-h-[500px] w-full object-contain select-none pointer-events-none"
            draggable={false}
          />

          <div className="absolute inset-0 z-10 pointer-events-none">
            {allDetections.map((det, index) => {
          const severity = det.severidad || det.severity || 'incipiente';
          const styles = getStyleBySeverity(severity);
          const boxStyle = getBoxStyle(det, index);
          const label = det.localizacion || (det.numero_diente ? `D${det.numero_diente}` : `Hallazgo ${index + 1}`);
          const severityLabel = getSeverityLabel(severity);
          const displayLabel = label === severityLabel ? severityLabel : `${label} · ${severityLabel}`;
          const confidence = Number.isFinite(det.confianza) ? Math.round(det.confianza * 100) : null;
          const detectionId = det.id_deteccion ?? `${severity}-${index}`;
          const isSelected = selectedDetectionId !== null && detectionId === selectedDetectionId;
          const isHiddenByIsolation = isolateSelection && selectedDetectionId !== null && !isSelected;
          const labelClassName = `${getLabelPlacementClass(index)} ${getLabelAnchorClass(index)}`;

          return (
            <button
              key={detectionId}
              type="button"
              onClick={() => onDetectionClick?.(det, index)}
              data-detection-id={detectionId}
              className={`absolute rounded-lg transition-all duration-300 pointer-events-auto text-left ${showBoxes ? `border-[3px] shadow-[0_0_15px_rgba(0,0,0,0.5)] ${styles.box}` : 'border border-transparent bg-transparent shadow-none'} ${showBoxes && isSelected ? 'ring-4 ring-dentBlue-900/80 scale-[1.02] z-20' : 'hover:scale-[1.01]'} ${isHiddenByIsolation ? 'opacity-0 pointer-events-none' : ''}`}
              style={boxStyle}
            >
              {shouldShowLabels && (
                <span
                  className={`absolute ${labelClassName} bg-white border ${styles.badge} text-[11px] font-black px-3 py-1 rounded-full whitespace-nowrap shadow-lg flex items-center gap-1 max-w-[12rem] truncate ${isSelected ? 'z-30 scale-105' : 'z-20'}`}
                >
                  {displayLabel}
                  {confidence !== null ? ` · ${confidence}%` : ''}
                </span>
              )}
            </button>
          );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BoundingBoxViewer;
