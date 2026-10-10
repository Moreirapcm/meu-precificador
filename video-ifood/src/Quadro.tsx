// Primitivas de "quadro branco": texto escrito à mão e traços desenhados,
// com uma caneta acompanhando a ponta do traço.
import React, {useMemo} from 'react';
import {interpolate, useCurrentFrame, Easing} from 'remotion';
import {getLength, getPointAtLength} from '@remotion/paths';
import '@fontsource/permanent-marker';
import '@fontsource/caveat/700.css';

export const COR = {
  preto: '#1d1d1f',
  vermelho: '#d7262f',
  verde: '#169b45',
  azul: '#1f4fd1',
  papel: '#fbfaf6',
};

export const FONTE_TITULO = '"Permanent Marker", cursive';
// Fator de velocidade: todos os tempos (em frames) são multiplicados por ele.
export const VEL = 1.5;

export const FONTE_MAO = '"Caveat", cursive';

const progresso = (frame: number, inicio: number, duracao: number) =>
  interpolate(frame, [inicio * VEL, (inicio + duracao) * VEL], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.quad),
  });

// Caneta com a ponta em (0,0), inclinada para baixo/direita como na mão.
export const Caneta: React.FC<{x: number; y: number; cor: string}> = ({x, y, cor}) => (
  <svg
    width={420}
    height={420}
    viewBox="0 0 420 420"
    style={{position: 'absolute', left: x, top: y, overflow: 'visible', pointerEvents: 'none'}}
  >
    <g transform="rotate(40)" style={{filter: 'drop-shadow(10px 18px 10px rgba(0,0,0,0.22))'}}>
      <polygon points="0,0 22,-9 22,9" fill={cor} />
      <rect x={20} y={-15} width={38} height={30} rx={4} fill={cor} />
      <rect x={56} y={-20} width={250} height={40} rx={14} fill="#f4f4f4" stroke="#d0d0d0" strokeWidth={2} />
      <rect x={70} y={-20} width={6} height={40} fill="#e2e2e2" />
      <rect x={290} y={-17} width={42} height={34} rx={8} fill={cor} />
    </g>
  </svg>
);

type EscreverProps = {
  texto: string;
  inicio: number;
  duracao?: number;
  cor?: string;
  tamanho?: number;
  fonte?: string;
  style?: React.CSSProperties;
};

// Revela o texto da esquerda para a direita, com a caneta na borda.
export const Escrever: React.FC<EscreverProps> = ({
  texto,
  inicio,
  duracao = 18,
  cor = COR.preto,
  tamanho = 80,
  fonte = FONTE_TITULO,
  style,
}) => {
  const frame = useCurrentFrame();
  const p = progresso(frame, inicio, duracao);
  if (frame < inicio * VEL) return null;
  const escrevendo = p > 0 && p < 1;
  return (
    <div style={{position: 'relative', display: 'inline-block', ...style}}>
      <div
        style={{
          fontFamily: fonte,
          fontSize: tamanho,
          color: cor,
          lineHeight: 1.1,
          whiteSpace: 'nowrap',
          // folga para letras inclinadas não serem cortadas no fim
          padding: '0 0.2em',
          clipPath: `inset(-20% ${(1 - p) * 100}% -20% -5%)`,
        }}
      >
        {texto}
      </div>
      {escrevendo ? (
        <div style={{position: 'absolute', left: `${p * 100}%`, top: '75%'}}>
          <Caneta x={0} y={0} cor={cor} />
        </div>
      ) : null}
    </div>
  );
};

type DesenharProps = {
  d: string;
  inicio: number;
  duracao?: number;
  cor?: string;
  espessura?: number;
  caneta?: boolean;
};

// Desenha um caminho SVG (coordenadas do quadro 1080x1920).
export const Desenhar: React.FC<DesenharProps> = ({
  d,
  inicio,
  duracao = 20,
  cor = COR.preto,
  espessura = 10,
  caneta = true,
}) => {
  const frame = useCurrentFrame();
  const total = useMemo(() => getLength(d), [d]);
  const p = progresso(frame, inicio, duracao);
  if (frame < inicio * VEL) return null;
  const ponta = getPointAtLength(d, Math.max(0.01, total * p));
  return (
    <>
      <svg
        width={1080}
        height={1920}
        style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}
      >
        <path
          d={d}
          fill="none"
          stroke={cor}
          strokeWidth={espessura}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={total}
          strokeDashoffset={total * (1 - p)}
        />
      </svg>
      {caneta && p > 0 && p < 1 ? <Caneta x={ponta.x} y={ponta.y} cor={cor} /> : null}
    </>
  );
};

// Elipse "à mão" em volta de uma área (cx, cy, rx, ry).
export const circulo = (cx: number, cy: number, rx: number, ry: number) =>
  `M ${cx - rx * 0.2} ${cy - ry * 1.02} ` +
  `C ${cx + rx * 0.6} ${cy - ry * 1.1}, ${cx + rx * 1.05} ${cy - ry * 0.5}, ${cx + rx} ${cy} ` +
  `C ${cx + rx * 0.95} ${cy + ry * 0.7}, ${cx + rx * 0.3} ${cy + ry * 1.05}, ${cx - rx * 0.2} ${cy + ry} ` +
  `C ${cx - rx * 0.8} ${cy + ry * 0.95}, ${cx - rx * 1.05} ${cy + ry * 0.4}, ${cx - rx} ${cy - ry * 0.05} ` +
  `C ${cx - rx * 0.95} ${cy - ry * 0.7}, ${cx - rx * 0.5} ${cy - ry * 1.0}, ${cx + rx * 0.15} ${cy - ry * 1.15}`;

// Entrada com "pop" para cartões/prints.
export const usePop = (inicio: number) => {
  const frame = useCurrentFrame();
  const s = interpolate(frame, [inicio * VEL, (inicio + 6) * VEL, (inicio + 10) * VEL], [0.6, 1.06, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return {visivel: frame >= inicio * VEL, escala: s};
};
