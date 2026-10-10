# Vídeo "Você vende no iFood e acha que tá lucrando?"

Animação estilo quadro branco feita com [Remotion](https://remotion.dev) (1080x1920, 30fps, ~57s). A velocidade geral é controlada por `VEL` em `src/Quadro.tsx`.

- Taxas: Plano Entrega do iFood — comissão 23% + pagamento online 3,2%
  (fonte: blog oficial iFood para Parceiros, 2026). Confira no Portal do Parceiro antes de publicar.
- Ingredientes (R$ 12,00) e embalagem (R$ 2,50) são valores de exemplo.

```bash
npm install
npx remotion studio src/index.ts          # editar/visualizar
npx remotion render src/index.ts IfoodLucro out/ifood-lucro.mp4
```
