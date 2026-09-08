import React from "react";
import Svg, { Circle, Path } from "react-native-svg";

// Fixed vector bounds avoid font-baseline clipping on iOS.
export default function CareIcon({
  kind,
  size = 26,
  color,
}: {
  kind: "feed" | "sleep" | "diaper";
  size?: number;
  color: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" accessible={false}>
      {kind === "feed" ? (
        <>
          <Circle
            cx={16}
            cy={16}
            r={12}
            stroke={color}
            strokeWidth={1.8}
            fill="none"
          />
          <Path d="M4 16H28A12 12 0 0 1 4 16Z" fill={color} />
        </>
      ) : kind === "sleep" ? (
        <Path d="M13 4A12 12 0 1 0 28 19A11 11 0 0 1 13 4Z" fill={color} />
      ) : (
        <>
          <Path
            d="M4 7Q16 10 28 7L27 18Q25 27 16 28Q7 27 5 18Z"
            fill="none"
            stroke={color}
            strokeWidth={1.8}
            strokeLinejoin="round"
          />
          <Path
            d="M4.5 12Q16 15 27.5 12M5 17Q12 17 12 26M27 17Q20 17 20 26M5 10L9 11M23 11L27 10"
            fill="none"
            stroke={color}
            strokeWidth={1.8}
            strokeLinecap="round"
          />
        </>
      )}
    </Svg>
  );
}
