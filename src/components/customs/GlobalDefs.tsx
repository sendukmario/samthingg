export default function GlobalDefs() {
  return (
    <svg
      style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}
    >
      <defs>
        <linearGradient id="circleGradientFixed" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#DF74FF" stopOpacity="1" />
          <stop offset="100%" stopColor="#562495" stopOpacity="1" />
        </linearGradient>
      </defs>

      <defs>
        <linearGradient
          id="paint0_linear_23_1029"
          x1="12.8882"
          y1="1.62201"
          x2="5.28103"
          y2="14.9454"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#00FFA3" />
          <stop offset="1" stopColor="#DC1FFF" />
        </linearGradient>
        <linearGradient
          id="paint1_linear_23_1029"
          x1="9.99037"
          y1="-0.0327791"
          x2="2.38316"
          y2="13.2906"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#00FFA3" />
          <stop offset="1" stopColor="#DC1FFF" />
        </linearGradient>
        <linearGradient
          id="paint2_linear_23_1029"
          x1="11.4301"
          y1="0.789348"
          x2="3.82287"
          y2="14.1127"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#00FFA3" />
          <stop offset="1" stopColor="#DC1FFF" />
        </linearGradient>
      </defs>
    </svg>
  );
}
