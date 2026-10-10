import React from 'react';
import {Composition} from 'remotion';
import {IfoodVideo, DURACAO} from './IfoodVideo';

export const Root: React.FC = () => (
  <Composition
    id="IfoodLucro"
    component={IfoodVideo}
    durationInFrames={DURACAO}
    fps={30}
    width={1080}
    height={1920}
  />
);
