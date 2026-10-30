import React, { useEffect } from 'react';
import { useChartScrub } from '../utils/useChartScrub';

// <svg> di un grafico che si sfoglia col dito (vedi useChartScrub).
// xs: coordinate x dei punti selezionabili nel viewBox; viewW: larghezza del viewBox.
// onScrubChange(bool): avvisa quando il dito è appoggiato (es. per non animare i numeri mentre si trascina).
// I tocchi sul grafico non risalgono ai contenitori: nello Storico la tessera cambia conto con uno swipe
// orizzontale, e trascinare lungo la linea non deve farlo scattare.
export default function ScrubSvg({ xs, viewW, onStart, onMove, onTap, onScrubChange, style, children, ...rest }) {
  const { scrubbing, svgProps } = useChartScrub({ xs, viewW, onStart, onMove, onTap });
  useEffect(() => { if (onScrubChange) onScrubChange(scrubbing); }, [scrubbing]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <svg
      {...rest}
      {...svgProps}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
      style={{ ...style, ...svgProps.style }}
    >
      {children}
    </svg>
  );
}
