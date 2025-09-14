import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface LogoProps {
  width?: number;
  color?: string;
}

export const Logo = ({ width = 78, color = "#ADD2EA" }: LogoProps) => {
  const height = (width / 78) * 32; // Maintain aspect ratio

  return (
    <Svg width={width} height={height} viewBox="0 0 78 32" fill="none">
      <Path
        d="M2.79541 28.7539C10.5434 12.2162 27.886 -2.83848 35.6669 3.46802C45.9851 11.8309 33.5123 35.6835 25.3228 28.7539C13.3695 18.6396 44.8618 -2.50853 55.6657 7.83564C65.3374 17.0958 55.8881 27.2887 51.7579 24.6162C43.9423 19.5591 57.9644 3.79791 75.2047 14.5339"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
      />
    </Svg>
  );
};