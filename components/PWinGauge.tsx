import React from 'react';

interface PWinGaugeProps {
  score: number;       // 0-100
  confidence: number;  // Margin of error (e.g., +/- 5%)
  size?: number;
}

const PWinGauge: React.FC<PWinGaugeProps> = ({ score, confidence, size = 120 }) => {
  const radius = size / 2;
  const strokeWidth = size * 0.1;
  const normalizedRadius = radius - strokeWidth * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  
  // Arc logic (semi-circle)
  const offset = circumference - (score / 100) * (circumference / 2);
  const rotation = -180; // Start from left

  // Confidence band calculations
  const lowerBound = Math.max(0, score - confidence);
  const upperBound = Math.min(100, score + confidence);
  
  const lowerOffset = circumference - (lowerBound / 100) * (circumference / 2);
  const upperOffset = circumference - (upperBound / 100) * (circumference / 2);
  const bandLength = lowerOffset - upperOffset;

  let color = 'text-red-500';
  if (score > 40) color = 'text-yellow-500';
  if (score > 70) color = 'text-green-500';

  return (
    <div className="relative flex flex-col items-center justify-center" style={{ width: size, height: size / 1.5 }}>
      <svg
        height={size}
        width={size}
        className="transform -rotate-90 overflow-visible"
      >
        {/* Background Track */}
        <circle
          stroke="rgba(51, 65, 85, 0.5)"
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference / 2} ${circumference}`}
          fill="transparent"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        
        {/* Confidence Band (Subtle) */}
        <circle
          stroke="currentColor"
          className="text-slate-700 opacity-30"
          strokeWidth={strokeWidth * 1.5}
          strokeDasharray={`${(upperBound - lowerBound) / 100 * (circumference / 2)} ${circumference}`}
          strokeDashoffset={-1 * (lowerBound / 100) * (circumference / 2)}
          fill="transparent"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />

        {/* Score Arc */}
        <circle
          stroke="currentColor"
          className={`${color} transition-all duration-1000 ease-out`}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference / 2} ${circumference}`}
          strokeDashoffset={offset}
          fill="transparent"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
      </svg>
      
      {/* Value Text */}
      <div className="absolute top-[60%] flex flex-col items-center">
        <span className={`text-2xl font-bold font-mono ${color}`}>
          {score}%
        </span>
        <span className="text-[10px] text-slate-500 font-medium">
          ±{confidence}% Conf.
        </span>
      </div>
    </div>
  );
};

export default PWinGauge;
