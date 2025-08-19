import React from "react";

type Segment = {
  value: number; // in percentage
  color: string;
};

type Props = {
  size?: number;
  strokeWidth?: number;
  gapDegree?: number; // gap in degrees
  segments: Segment[];
};

const SquareSegmentedRing: React.FC<Props> = ({
  size = 120,
  strokeWidth = 10,
  gapDegree = 4,
  segments,
}) => {
  const sideLength = size - strokeWidth;
  const perimeter = 4 * sideLength;

  const totalValue = segments.reduce((acc, s) => acc + s.value, 0);
  const totalGapLength = (gapDegree / 360) * perimeter * segments.length;
  const effectivePerimeter = perimeter - totalGapLength;
  const lengthPerUnit = effectivePerimeter / totalValue;

  let currentLength = 0;

  // Create a path that traces the border of a square
  const squarePath = `
    M ${strokeWidth / 2},${strokeWidth / 2}
    H ${size - strokeWidth / 2}
    V ${size - strokeWidth / 2}
    H ${strokeWidth / 2}
    Z
  `;

  return (
    <svg width={size} height={size}>
      {(segments || [])?.map((seg, i) => {
        const segmentLength = seg.value * lengthPerUnit;
        const gapLength = (gapDegree / 360) * perimeter;

        const dasharray = `${segmentLength} ${perimeter - segmentLength}`;
        const dashoffset = perimeter - currentLength;

        currentLength += segmentLength + gapLength;

        return (
          <path
            key={i}
            d={squarePath}
            fill="none"
            stroke={seg.color}
            strokeWidth={strokeWidth}
            strokeDasharray={dasharray}
            strokeDashoffset={dashoffset}
            strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
};

export default SquareSegmentedRing;
