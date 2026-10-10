import React from 'react';
import {AbsoluteFill, Sequence, interpolate, useCurrentFrame} from 'remotion';
import {COR, FONTE_MAO, Escrever, Desenhar, circulo} from './Quadro';

// Taxas oficiais do Plano Entrega do iFood (blog-parceiros.ifood.com.br, 2026):
// comissão 23% + taxa de pagamento online 3,2%.
// Custos de ingredientes e embalagem são valores de exemplo.

const CENAS = [
  {dur: 100}, // gancho
  {dur: 230}, // taxas iFood
  {dur: 230}, // custos e sobra
  {dur: 160}, // virada
  {dur: 200}, // preço certo
  {dur: 150}, // chamada
];
export const DURACAO = CENAS.reduce((s, c) => s + c.dur, 0);

const Linha: React.FC<{y: number; x?: number; children: React.ReactNode}> = ({y, x, children}) => (
  <div
    style={{
      position: 'absolute',
      top: y,
      left: x ?? 0,
      width: x === undefined ? 1080 : undefined,
      textAlign: x === undefined ? 'center' : 'left',
    }}
  >
    {children}
  </div>
);

const Rodape: React.FC<{inicio: number; texto: string}> = ({inicio, texto}) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [inicio, inicio + 10], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 150,
        left: 80,
        right: 80,
        fontFamily: 'Arial, sans-serif',
        fontSize: 28,
        color: '#666',
        opacity: o,
        textAlign: 'center',
      }}
    >
      {texto}
    </div>
  );
};

const Cena: React.FC<{dur: number; children: React.ReactNode}> = ({dur, children}) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [dur - 8, dur], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return <AbsoluteFill style={{opacity: o}}>{children}</AbsoluteFill>;
};

// Item da conta: rótulo à esquerda, valor à direita.
const Item: React.FC<{y: number; inicio: number; rotulo: string; valor: string; cor?: string}> = ({
  y,
  inicio,
  rotulo,
  valor,
  cor = COR.vermelho,
}) => (
  <>
    <Linha y={y} x={90}>
      <Escrever texto={rotulo} inicio={inicio} duracao={16} tamanho={64} fonte={FONTE_MAO} />
    </Linha>
    <Linha y={y} x={690}>
      <Escrever texto={valor} inicio={inicio + 16} duracao={10} tamanho={64} cor={cor} />
    </Linha>
  </>
);

const Gancho: React.FC = () => (
  <>
    <Linha y={260}>
      <Escrever texto="Vendeu um lanche de" inicio={0} duracao={20} tamanho={70} fonte={FONTE_MAO} />
    </Linha>
    <Linha y={380}>
      <Escrever texto="R$ 30" inicio={22} duracao={14} tamanho={220} cor={COR.vermelho} />
    </Linha>
    <Linha y={660}>
      <Escrever texto="no iFood?" inicio={38} duracao={14} tamanho={110} />
    </Linha>
    {/* hambúrguer desenhado */}
    <Desenhar d="M 330 1130 C 340 940, 740 940, 750 1130 Z" inicio={54} duracao={14} cor="#c77d1a" />
    <Desenhar d="M 310 1170 C 420 1150, 660 1190, 770 1165" inicio={68} duracao={8} cor={COR.verde} espessura={14} />
    <Desenhar d="M 320 1215 L 760 1215" inicio={76} duracao={8} cor="#6b3b1f" espessura={26} />
    <Desenhar d="M 330 1260 C 340 1340, 740 1340, 750 1260 Z" inicio={84} duracao={10} cor="#c77d1a" />
  </>
);

const Taxas: React.FC = () => (
  <>
    <Linha y={180}>
      <Escrever texto="QUANTO O iFOOD LEVA?" inicio={0} duracao={22} tamanho={78} />
    </Linha>
    <Linha y={330} x={90}>
      <Escrever texto="Plano Entrega:" inicio={26} duracao={12} tamanho={56} cor={COR.azul} fonte={FONTE_MAO} />
    </Linha>
    <Item y={440} inicio={40} rotulo="comissão 23%" valor="- R$ 6,90" />
    <Item y={560} inicio={72} rotulo="pagamento online 3,2%" valor="- R$ 0,96" />
    <Desenhar d="M 90 700 L 990 700" inicio={104} duracao={10} espessura={8} />
    <Linha y={760}>
      <Escrever texto="iFood fica com" inicio={116} duracao={14} tamanho={70} fonte={FONTE_MAO} />
    </Linha>
    <Linha y={860}>
      <Escrever texto="R$ 7,86" inicio={132} duracao={14} tamanho={170} cor={COR.vermelho} />
    </Linha>
    <Desenhar d={circulo(540, 978, 350, 108)} inicio={150} duracao={18} cor={COR.vermelho} espessura={9} />
    <Linha y={1180}>
      <Escrever texto="(26,2% de cada pedido)" inicio={170} duracao={18} tamanho={60} fonte={FONTE_MAO} />
    </Linha>
    <Rodape
      inicio={120}
      texto="Fonte: blog oficial iFood para Parceiros (2026) — Plano Entrega: comissão 23% + pagamento online 3,2%. Mensalidade de R$ 150 acima de R$ 1.800/mês."
    />
  </>
);

const Custos: React.FC = () => (
  <>
    <Linha y={180}>
      <Escrever texto="E AINDA TEM..." inicio={0} duracao={18} tamanho={86} />
    </Linha>
    <Item y={360} inicio={22} rotulo="taxas iFood" valor="- R$ 7,86" />
    <Item y={480} inicio={50} rotulo="ingredientes" valor="- R$ 12,00" />
    <Item y={600} inicio={78} rotulo="embalagem" valor="- R$ 2,50" />
    <Desenhar d="M 90 740 L 990 740" inicio={106} duracao={10} espessura={8} />
    <Linha y={790}>
      <Escrever texto="sobrou" inicio={118} duracao={10} tamanho={80} fonte={FONTE_MAO} />
    </Linha>
    <Linha y={880}>
      <Escrever texto="R$ 7,64" inicio={130} duracao={14} tamanho={170} cor={COR.vermelho} />
    </Linha>
    <Linha y={1140}>
      <Escrever texto="...e o aluguel? o gás?" inicio={152} duracao={22} tamanho={68} cor={COR.azul} fonte={FONTE_MAO} />
    </Linha>
    <Linha y={1240}>
      <Escrever texto="o SEU salário?" inicio={178} duracao={18} tamanho={86} cor={COR.azul} />
    </Linha>
    <Rodape inicio={30} texto="Ingredientes e embalagem: valores de exemplo. Use os custos reais do seu produto." />
  </>
);

const Virada: React.FC = () => (
  <>
    <Linha y={330}>
      <Escrever texto="o problema não é" inicio={0} duracao={18} tamanho={80} fonte={FONTE_MAO} />
    </Linha>
    <Linha y={460}>
      <Escrever texto="VENDER POUCO" inicio={20} duracao={18} tamanho={110} />
    </Linha>
    <Desenhar d="M 140 590 L 940 480" inicio={44} duracao={10} cor={COR.vermelho} espessura={14} />
    <Linha y={780}>
      <Escrever texto="é PREÇO" inicio={62} duracao={16} tamanho={150} cor={COR.vermelho} />
    </Linha>
    <Linha y={960}>
      <Escrever texto="ERRADO!" inicio={80} duracao={16} tamanho={150} cor={COR.vermelho} />
    </Linha>
    <Desenhar d="M 220 1150 C 420 1130, 680 1170, 870 1135" inicio={100} duracao={12} cor={COR.vermelho} espessura={12} />
  </>
);

const PrecoCerto: React.FC = () => (
  <>
    <Linha y={170}>
      <Escrever texto="COM O PREÇO CERTO:" inicio={0} duracao={20} tamanho={78} cor={COR.verde} />
    </Linha>
    <Linha y={350} x={60}>
      <Escrever texto="R$ 30" inicio={24} duracao={10} tamanho={110} />
    </Linha>
    <Desenhar d="M 50 465 L 370 365" inicio={36} duracao={8} cor={COR.vermelho} espessura={12} />
    <Desenhar d="M 390 420 L 520 420 M 480 385 L 525 420 L 480 455" inicio={46} duracao={10} cor={COR.verde} />
    <Linha y={345} x={550}>
      <Escrever texto="R$ 33,90" inicio={58} duracao={14} tamanho={110} cor={COR.verde} />
    </Linha>
    <Linha y={600}>
      <Escrever texto="sobra no seu bolso" inicio={78} duracao={16} tamanho={70} fonte={FONTE_MAO} />
    </Linha>
    <Linha y={700}>
      <Escrever texto="R$ 10,52" inicio={96} duracao={14} tamanho={170} cor={COR.verde} />
    </Linha>
    <Desenhar d={circulo(540, 810, 380, 108)} inicio={112} duracao={16} cor={COR.verde} espessura={9} />
    {/* barras subindo */}
    <Desenhar d="M 300 1400 L 300 1300 L 380 1300 L 380 1400" inicio={132} duracao={8} cor={COR.verde} />
    <Desenhar d="M 430 1400 L 430 1240 L 510 1240 L 510 1400" inicio={140} duracao={8} cor={COR.verde} />
    <Desenhar d="M 560 1400 L 560 1160 L 640 1160 L 640 1400" inicio={148} duracao={8} cor={COR.verde} />
    <Desenhar d="M 690 1400 L 690 1070 L 770 1070 L 770 1400" inicio={156} duracao={8} cor={COR.verde} />
    <Desenhar d="M 260 1400 L 820 1400" inicio={164} duracao={6} />
    <Linha y={1440}>
      <Escrever texto="+38% de lucro no mesmo pedido" inicio={170} duracao={20} tamanho={62} cor={COR.verde} fonte={FONTE_MAO} />
    </Linha>
    <Rodape inicio={60} texto="Mesmo custo de R$ 14,50 e mesmas taxas do iFood (26,2%)." />
  </>
);

const Chamada: React.FC = () => (
  <>
    <Linha y={360}>
      <Escrever texto="antes de vender mais," inicio={0} duracao={20} tamanho={76} fonte={FONTE_MAO} />
    </Linha>
    <Linha y={500}>
      <Escrever texto="PRECIFIQUE" inicio={22} duracao={16} tamanho={140} cor={COR.vermelho} />
    </Linha>
    <Linha y={680}>
      <Escrever texto="CERTO." inicio={40} duracao={12} tamanho={140} cor={COR.vermelho} />
    </Linha>
    <Linha y={930}>
      <Escrever texto="com a taxa do iFood já na conta" inicio={58} duracao={24} tamanho={64} cor={COR.azul} fonte={FONTE_MAO} />
    </Linha>
    <Desenhar d="M 540 1080 L 540 1330 M 470 1260 L 540 1335 L 610 1260" inicio={88} duracao={16} cor={COR.preto} espessura={12} />
  </>
);

const COMPONENTES = [Gancho, Taxas, Custos, Virada, PrecoCerto, Chamada];

export const IfoodVideo: React.FC = () => {
  let inicio = 0;
  return (
    <AbsoluteFill style={{backgroundColor: COR.papel}}>
      {CENAS.map((c, i) => {
        const C = COMPONENTES[i];
        const seq = (
          <Sequence key={i} from={inicio} durationInFrames={c.dur}>
            <Cena dur={c.dur}>
              <C />
            </Cena>
          </Sequence>
        );
        inicio += c.dur;
        return seq;
      })}
    </AbsoluteFill>
  );
};
