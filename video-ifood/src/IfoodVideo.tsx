import React from 'react';
import {AbsoluteFill, Sequence, interpolate, useCurrentFrame} from 'remotion';
import {COR, FONTE_MAO, VEL, Escrever, Desenhar, circulo} from './Quadro';

// Taxas oficiais do Plano Entrega do iFood (blog-parceiros.ifood.com.br, 2026):
// comissão 23% + taxa de pagamento online 3,2%.
// Custos de ingredientes e embalagem são valores de exemplo.

// Durações em "tempos" (frames antes do fator VEL).
const CENAS = [
  {dur: 110}, // gancho
  {dur: 240}, // taxas iFood
  {dur: 250}, // custos e sobra
  {dur: 160}, // virada
  {dur: 215}, // preço certo
  {dur: 160}, // chamada
];
export const DURACAO = Math.round(CENAS.reduce((s, c) => s + c.dur, 0) * VEL);

const Linha: React.FC<{y: number; x?: number; direita?: boolean; children: React.ReactNode}> = ({
  y,
  x,
  direita,
  children,
}) => (
  <div
    style={{
      position: 'absolute',
      top: y,
      left: direita ? 0 : x ?? 0,
      width: x === undefined ? 1080 : undefined,
      paddingRight: direita ? 90 : 0,
      boxSizing: 'border-box',
      textAlign: direita ? 'right' : x === undefined ? 'center' : 'left',
    }}
  >
    {children}
  </div>
);

const Rodape: React.FC<{inicio: number; texto: string}> = ({inicio, texto}) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [inicio * VEL, (inicio + 10) * VEL], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 170,
        left: 70,
        right: 70,
        fontFamily: 'Arial, sans-serif',
        fontSize: 40,
        lineHeight: 1.3,
        color: '#555',
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
  const o = interpolate(frame, [dur - 10, dur], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return <AbsoluteFill style={{opacity: o}}>{children}</AbsoluteFill>;
};

// Item da conta: rótulo à esquerda e, logo abaixo, o valor alinhado à direita.
const Item: React.FC<{y: number; inicio: number; rotulo: string; valor: string; cor?: string}> = ({
  y,
  inicio,
  rotulo,
  valor,
  cor = COR.vermelho,
}) => (
  <>
    <Linha y={y} x={90}>
      <Escrever texto={rotulo} inicio={inicio} duracao={16} tamanho={88} fonte={FONTE_MAO} />
    </Linha>
    <Linha y={y + 80} direita>
      <Escrever texto={valor} inicio={inicio + 16} duracao={10} tamanho={86} cor={cor} />
    </Linha>
  </>
);

const Gancho: React.FC = () => (
  <>
    <Linha y={250}>
      <Escrever texto="Vendeu um lanche de" inicio={0} duracao={20} tamanho={100} fonte={FONTE_MAO} />
    </Linha>
    <Linha y={380}>
      <Escrever texto="R$ 30" inicio={22} duracao={14} tamanho={240} cor={COR.vermelho} />
    </Linha>
    <Linha y={670}>
      <Escrever texto="no iFood?" inicio={38} duracao={14} tamanho={130} />
    </Linha>
    {/* hambúrguer desenhado */}
    <Desenhar d="M 330 1150 C 340 960, 740 960, 750 1150 Z" inicio={54} duracao={14} cor="#c77d1a" />
    <Desenhar d="M 310 1190 C 420 1170, 660 1210, 770 1185" inicio={68} duracao={8} cor={COR.verde} espessura={14} />
    <Desenhar d="M 320 1235 L 760 1235" inicio={76} duracao={8} cor="#6b3b1f" espessura={26} />
    <Desenhar d="M 330 1280 C 340 1360, 740 1360, 750 1280 Z" inicio={84} duracao={10} cor="#c77d1a" />
  </>
);

const Taxas: React.FC = () => (
  <>
    <Linha y={140}>
      <Escrever texto="QUANTO O" inicio={0} duracao={12} tamanho={110} />
    </Linha>
    <Linha y={265}>
      <Escrever texto="iFOOD LEVA?" inicio={12} duracao={14} tamanho={110} />
    </Linha>
    <Linha y={420} x={90}>
      <Escrever texto="Plano Entrega:" inicio={28} duracao={12} tamanho={80} cor={COR.azul} fonte={FONTE_MAO} />
    </Linha>
    <Item y={520} inicio={42} rotulo="comissão 23%" valor="- R$ 6,90" />
    <Item y={720} inicio={74} rotulo="pagamento online 3,2%" valor="- R$ 0,96" />
    <Desenhar d="M 90 920 L 990 920" inicio={106} duracao={10} espessura={8} />
    <Linha y={950}>
      <Escrever texto="o iFood fica com" inicio={118} duracao={14} tamanho={90} fonte={FONTE_MAO} />
    </Linha>
    <Linha y={1060}>
      <Escrever texto="R$ 7,86" inicio={134} duracao={14} tamanho={180} cor={COR.vermelho} />
    </Linha>
    <Desenhar d={circulo(540, 1180, 360, 112)} inicio={152} duracao={18} cor={COR.vermelho} espessura={9} />
    <Linha y={1320}>
      <Escrever texto="(26,2% de cada pedido)" inicio={172} duracao={18} tamanho={84} fonte={FONTE_MAO} />
    </Linha>
    <Rodape inicio={122} texto="Fonte: blog oficial iFood para Parceiros (2026). Plano Entrega: comissão 23% + pagamento online 3,2%." />
  </>
);

const Custos: React.FC = () => (
  <>
    <Linha y={150}>
      <Escrever texto="E AINDA TEM..." inicio={0} duracao={18} tamanho={110} />
    </Linha>
    <Item y={320} inicio={22} rotulo="taxas do iFood" valor="- R$ 7,86" />
    <Item y={510} inicio={50} rotulo="ingredientes" valor="- R$ 12,00" />
    <Item y={700} inicio={78} rotulo="embalagem" valor="- R$ 2,50" />
    <Desenhar d="M 90 900 L 990 900" inicio={106} duracao={10} espessura={8} />
    <Linha y={925}>
      <Escrever texto="sobrou" inicio={118} duracao={10} tamanho={96} fonte={FONTE_MAO} />
    </Linha>
    <Linha y={1030}>
      <Escrever texto="R$ 7,64" inicio={130} duracao={14} tamanho={180} cor={COR.vermelho} />
    </Linha>
    <Linha y={1250}>
      <Escrever texto="...e o aluguel? o gás?" inicio={155} duracao={22} tamanho={88} cor={COR.azul} fonte={FONTE_MAO} />
    </Linha>
    <Linha y={1360}>
      <Escrever texto="o SEU salário?" inicio={182} duracao={18} tamanho={100} cor={COR.azul} />
    </Linha>
    <Rodape inicio={30} texto="Ingredientes e embalagem: valores de exemplo." />
  </>
);

const Virada: React.FC = () => (
  <>
    <Linha y={330}>
      <Escrever texto="o problema não é" inicio={0} duracao={18} tamanho={100} fonte={FONTE_MAO} />
    </Linha>
    <Linha y={470}>
      <Escrever texto="VENDER POUCO" inicio={20} duracao={18} tamanho={120} />
    </Linha>
    <Desenhar d="M 110 610 L 970 490" inicio={44} duracao={10} cor={COR.vermelho} espessura={14} />
    <Linha y={780}>
      <Escrever texto="é PREÇO" inicio={62} duracao={16} tamanho={160} cor={COR.vermelho} />
    </Linha>
    <Linha y={970}>
      <Escrever texto="ERRADO!" inicio={80} duracao={16} tamanho={160} cor={COR.vermelho} />
    </Linha>
    <Desenhar d="M 200 1170 C 420 1150, 680 1190, 890 1155" inicio={100} duracao={12} cor={COR.vermelho} espessura={12} />
  </>
);

const PrecoCerto: React.FC = () => (
  <>
    <Linha y={150}>
      <Escrever texto="COM O PREÇO" inicio={0} duracao={14} tamanho={110} cor={COR.verde} />
    </Linha>
    <Linha y={275}>
      <Escrever texto="CERTO:" inicio={14} duracao={10} tamanho={110} cor={COR.verde} />
    </Linha>
    <Linha y={450} x={60}>
      <Escrever texto="R$ 30" inicio={28} duracao={10} tamanho={110} />
    </Linha>
    <Desenhar d="M 50 565 L 370 465" inicio={40} duracao={8} cor={COR.vermelho} espessura={12} />
    <Desenhar d="M 390 520 L 520 520 M 480 485 L 525 520 L 480 555" inicio={50} duracao={10} cor={COR.verde} />
    <Linha y={445} x={550}>
      <Escrever texto="R$ 33,90" inicio={62} duracao={14} tamanho={110} cor={COR.verde} />
    </Linha>
    <Linha y={690}>
      <Escrever texto="sobra no seu bolso" inicio={82} duracao={16} tamanho={96} fonte={FONTE_MAO} />
    </Linha>
    <Linha y={800}>
      <Escrever texto="R$ 10,52" inicio={100} duracao={14} tamanho={180} cor={COR.verde} />
    </Linha>
    <Desenhar d={circulo(540, 920, 400, 112)} inicio={116} duracao={16} cor={COR.verde} espessura={9} />
    {/* barras subindo */}
    <Desenhar d="M 300 1430 L 300 1340 L 380 1340 L 380 1430" inicio={136} duracao={8} cor={COR.verde} />
    <Desenhar d="M 430 1430 L 430 1280 L 510 1280 L 510 1430" inicio={144} duracao={8} cor={COR.verde} />
    <Desenhar d="M 560 1430 L 560 1200 L 640 1200 L 640 1430" inicio={152} duracao={8} cor={COR.verde} />
    <Desenhar d="M 690 1430 L 690 1110 L 770 1110 L 770 1430" inicio={160} duracao={8} cor={COR.verde} />
    <Desenhar d="M 260 1430 L 820 1430" inicio={168} duracao={6} />
    <Linha y={1460}>
      <Escrever texto="+38% de lucro no mesmo pedido" inicio={174} duracao={22} tamanho={84} cor={COR.verde} fonte={FONTE_MAO} />
    </Linha>
  </>
);

const Chamada: React.FC = () => (
  <>
    <Linha y={340}>
      <Escrever texto="antes de vender mais," inicio={0} duracao={20} tamanho={100} fonte={FONTE_MAO} />
    </Linha>
    <Linha y={490}>
      <Escrever texto="PRECIFIQUE" inicio={22} duracao={16} tamanho={150} cor={COR.vermelho} />
    </Linha>
    <Linha y={680}>
      <Escrever texto="CERTO." inicio={40} duracao={12} tamanho={150} cor={COR.vermelho} />
    </Linha>
    <Linha y={920}>
      <Escrever texto="com a taxa do iFood" inicio={58} duracao={18} tamanho={92} cor={COR.azul} fonte={FONTE_MAO} />
    </Linha>
    <Linha y={1030}>
      <Escrever texto="já na conta" inicio={76} duracao={12} tamanho={92} cor={COR.azul} fonte={FONTE_MAO} />
    </Linha>
    <Desenhar d="M 540 1190 L 540 1420 M 470 1350 L 540 1425 L 610 1350" inicio={94} duracao={16} cor={COR.preto} espessura={12} />
  </>
);

const COMPONENTES = [Gancho, Taxas, Custos, Virada, PrecoCerto, Chamada];

export const IfoodVideo: React.FC = () => {
  let inicio = 0;
  return (
    <AbsoluteFill style={{backgroundColor: COR.papel}}>
      {CENAS.map((c, i) => {
        const C = COMPONENTES[i];
        const dur = Math.round(c.dur * VEL);
        const seq = (
          <Sequence key={i} from={inicio} durationInFrames={dur}>
            <Cena dur={dur}>
              <C />
            </Cena>
          </Sequence>
        );
        inicio += dur;
        return seq;
      })}
    </AbsoluteFill>
  );
};
