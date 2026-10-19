import React from 'react';

const particleStyles = `
  @keyframes drift-slow {
    0% { transform: translate3d(0, 0, 0); }
    100% { transform: translate3d(1920px, 0, 0); }
  }
  @keyframes drift-mid {
    0% { transform: translate3d(0, 0, 0); }
    100% { transform: translate3d(1920px, 0, 0); }
  }
  @keyframes drift-near {
    0% { transform: translate3d(0, 0, 0); }
    100% { transform: translate3d(1920px, 0, 0); }
  }
  @keyframes float-y1 {
    0%, 100% { transform: translate3d(0, -10px, 0); }
    50% { transform: translate3d(0, 10px, 0); }
  }
  @keyframes float-y2 {
    0%, 100% { transform: translate3d(0, 14px, 0); }
    50% { transform: translate3d(0, -12px, 0); }
  }
  @keyframes float-y3 {
    0%, 100% { transform: translate3d(0, -7px, 0); }
    50% { transform: translate3d(0, 9px, 0); }
  }
  .layer-slow {
    animation: drift-slow 50s linear infinite;
    will-change: transform;
  }
  .layer-mid {
    animation: drift-mid 34s linear infinite;
    will-change: transform;
  }
  .layer-near {
    animation: drift-near 22s linear infinite;
    will-change: transform;
  }
  .float-1 {
    animation: float-y1 8s ease-in-out infinite;
    will-change: transform;
  }
  .float-2 {
    animation: float-y2 11s ease-in-out infinite;
    will-change: transform;
  }
  .float-3 {
    animation: float-y3 9s ease-in-out infinite;
    will-change: transform;
  }
`;

export default function SandParticleOverlay() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1920 1080"
      preserveAspectRatio="xMidYMid slice"
      className="fixed inset-0 w-screen h-screen pointer-events-none z-[1] overflow-hidden"
    >
      <defs>
        <filter id="blur-soft" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="0.8" />
        </filter>
        <filter id="blur-near" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.4" />
        </filter>

        <g id="sand-far">
          <circle cx="95" cy="65" r="1.3" fill="#D4B07A" opacity="0.32" />
          <circle cx="230" cy="115" r="1.5" fill="#F0D8B4" opacity="0.28" />
          <circle cx="386" cy="84" r="1.7" fill="#C8A265" opacity="0.35" />
          <circle cx="515" cy="142" r="1.2" fill="#D4B07A" opacity="0.30" />
          <circle cx="630" cy="179" r="1.4" fill="#E6CCA0" opacity="0.27" />
          <circle cx="760" cy="110" r="1.3" fill="#F0D8B4" opacity="0.34" />
          <circle cx="878" cy="82" r="1.5" fill="#E6CCA0" opacity="0.36" />
          <circle cx="1015" cy="148" r="1.2" fill="#C8A265" opacity="0.29" />
          <circle cx="1144" cy="124" r="1.6" fill="#D4B07A" opacity="0.35" />
          <circle cx="1270" cy="75" r="1.4" fill="#F0D8B4" opacity="0.31" />
          <circle cx="1357" cy="180" r="1.5" fill="#C8A265" opacity="0.33" />
          <circle cx="1490" cy="112" r="1.2" fill="#E6CCA0" opacity="0.28" />
          <circle cx="1587" cy="189" r="1.7" fill="#D4B07A" opacity="0.30" />
          <circle cx="1740" cy="95" r="1.3" fill="#F0D8B4" opacity="0.35" />
          <circle cx="1880" cy="150" r="1.6" fill="#C8A265" opacity="0.27" />
          <circle cx="110" cy="290" r="1.4" fill="#E6CCA0" opacity="0.33" />
          <circle cx="267" cy="272" r="1.3" fill="#D4B07A" opacity="0.29" />
          <circle cx="430" cy="340" r="1.5" fill="#F0D8B4" opacity="0.32" />
          <circle cx="585" cy="265" r="1.2" fill="#C8A265" opacity="0.30" />
          <circle cx="804" cy="375" r="1.6" fill="#C8A265" opacity="0.34" />
          <circle cx="993" cy="407" r="1.5" fill="#D4B07A" opacity="0.35" />
          <circle cx="1180" cy="285" r="1.3" fill="#F0D8B4" opacity="0.31" />
          <circle cx="1411" cy="329" r="1.4" fill="#E6CCA0" opacity="0.26" />
          <circle cx="1605" cy="316" r="1.7" fill="#E6CCA0" opacity="0.32" />
          <circle cx="1730" cy="380" r="1.3" fill="#D4B07A" opacity="0.34" />
          <circle cx="1844" cy="299" r="1.5" fill="#F0D8B4" opacity="0.33" />
          <circle cx="75" cy="510" r="1.3" fill="#D4B07A" opacity="0.28" />
          <circle cx="160" cy="617" r="1.6" fill="#C8A265" opacity="0.35" />
          <circle cx="310" cy="485" r="1.4" fill="#F0D8B4" opacity="0.30" />
          <circle cx="447" cy="598" r="1.7" fill="#E6CCA0" opacity="0.27" />
          <circle cx="642" cy="610" r="1.3" fill="#C8A265" opacity="0.33" />
          <circle cx="755" cy="495" r="1.5" fill="#D4B07A" opacity="0.36" />
          <circle cx="866" cy="514" r="1.2" fill="#C8A265" opacity="0.31" />
          <circle cx="1035" cy="491" r="1.4" fill="#F0D8B4" opacity="0.32" />
          <circle cx="1165" cy="560" r="1.3" fill="#E6CCA0" opacity="0.29" />
          <circle cx="1255" cy="577" r="1.6" fill="#C8A265" opacity="0.33" />
          <circle cx="1480" cy="520" r="1.4" fill="#D4B07A" opacity="0.35" />
          <circle cx="1648" cy="614" r="1.7" fill="#E6CCA0" opacity="0.31" />
          <circle cx="1766" cy="459" r="1.5" fill="#F0D8B4" opacity="0.29" />
          <circle cx="90" cy="760" r="1.4" fill="#E6CCA0" opacity="0.30" />
          <circle cx="208" cy="724" r="1.5" fill="#C8A265" opacity="0.27" />
          <circle cx="348" cy="735" r="1.6" fill="#D4B07A" opacity="0.32" />
          <circle cx="510" cy="795" r="1.3" fill="#F0D8B4" opacity="0.34" />
          <circle cx="647" cy="736" r="1.5" fill="#C8A265" opacity="0.32" />
          <circle cx="780" cy="820" r="1.2" fill="#D4B07A" opacity="0.28" />
          <circle cx="906" cy="717" r="1.5" fill="#E6CCA0" opacity="0.36" />
          <circle cx="1070" cy="780" r="1.4" fill="#F0D8B4" opacity="0.33" />
          <circle cx="1240" cy="725" r="1.3" fill="#D4B07A" opacity="0.29" />
          <circle cx="1405" cy="770" r="1.4" fill="#C8A265" opacity="0.27" />
          <circle cx="1474" cy="806" r="1.3" fill="#E6CCA0" opacity="0.31" />
          <circle cx="1690" cy="740" r="1.6" fill="#F0D8B4" opacity="0.35" />
          <circle cx="1890" cy="787" r="1.5" fill="#D4B07A" opacity="0.30" />
          <circle cx="148" cy="996" r="1.5" fill="#D4B07A" opacity="0.28" />
          <circle cx="279" cy="1036" r="1.6" fill="#C8A265" opacity="0.35" />
          <circle cx="415" cy="940" r="1.3" fill="#F0D8B4" opacity="0.31" />
          <circle cx="508" cy="1022" r="1.4" fill="#D4B07A" opacity="0.33" />
          <circle cx="720" cy="960" r="1.6" fill="#C8A265" opacity="0.29" />
          <circle cx="897" cy="965" r="1.7" fill="#E6CCA0" opacity="0.30" />
          <circle cx="1117" cy="947" r="1.5" fill="#D4B07A" opacity="0.27" />
          <circle cx="1281" cy="1000" r="1.3" fill="#E6CCA0" opacity="0.32" />
          <circle cx="1420" cy="935" r="1.5" fill="#F0D8B4" opacity="0.36" />
          <circle cx="1570" cy="1043" r="1.4" fill="#D4B07A" opacity="0.34" />
          <circle cx="1780" cy="980" r="1.6" fill="#C8A265" opacity="0.30" />
        </g>

        <g id="sand-mid" filter="url(#blur-soft)">
          <circle cx="85" cy="160" r="2.1" fill="#F0D8B4" opacity="0.33" />
          <circle cx="206" cy="117" r="2.3" fill="#C8A265" opacity="0.35" />
          <circle cx="371" cy="210" r="2.2" fill="#D4B07A" opacity="0.31" />
          <circle cx="530" cy="95" r="1.9" fill="#E6CCA0" opacity="0.36" />
          <circle cx="672" cy="202" r="2.4" fill="#D4B07A" opacity="0.29" />
          <circle cx="840" cy="130" r="2.0" fill="#F0D8B4" opacity="0.38" />
          <circle cx="1021" cy="168" r="2.1" fill="#C8A265" opacity="0.34" />
          <circle cx="1230" cy="110" r="2.3" fill="#D4B07A" opacity="0.30" />
          <circle cx="1450" cy="220" r="1.9" fill="#F0D8B4" opacity="0.35" />
          <circle cx="1660" cy="140" r="2.2" fill="#E6CCA0" opacity="0.32" />
          <circle cx="1867" cy="210" r="2.0" fill="#C8A265" opacity="0.33" />
          <circle cx="115" cy="460" r="1.9" fill="#D4B07A" opacity="0.38" />
          <circle cx="270" cy="350" r="2.3" fill="#F0D8B4" opacity="0.31" />
          <circle cx="464" cy="388" r="2.2" fill="#D4B07A" opacity="0.34" />
          <circle cx="610" cy="430" r="2.0" fill="#C8A265" opacity="0.30" />
          <circle cx="719" cy="313" r="2.1" fill="#E6CCA0" opacity="0.36" />
          <circle cx="880" cy="410" r="2.4" fill="#F0D8B4" opacity="0.37" />
          <circle cx="1032" cy="345" r="2.3" fill="#D4B07A" opacity="0.39" />
          <circle cx="1210" cy="440" r="2.0" fill="#C8A265" opacity="0.32" />
          <circle cx="1424" cy="389" r="2.5" fill="#E6CCA0" opacity="0.37" />
          <circle cx="1630" cy="330" r="2.1" fill="#D4B07A" opacity="0.34" />
          <circle cx="1869" cy="366" r="1.9" fill="#E6CCA0" opacity="0.38" />
          <circle cx="170" cy="630" r="2.2" fill="#F0D8B4" opacity="0.35" />
          <circle cx="287" cy="572" r="2.0" fill="#E6CCA0" opacity="0.32" />
          <circle cx="378" cy="683" r="2.3" fill="#D4B07A" opacity="0.34" />
          <circle cx="560" cy="590" r="2.1" fill="#C8A265" opacity="0.29" />
          <circle cx="780" cy="650" r="2.4" fill="#F0D8B4" opacity="0.36" />
          <circle cx="923" cy="740" r="1.9" fill="#E6CCA0" opacity="0.30" />
          <circle cx="1103" cy="666" r="2.5" fill="#E6CCA0" opacity="0.35" />
          <circle cx="1290" cy="600" r="2.1" fill="#D4B07A" opacity="0.33" />
          <circle cx="1443" cy="613" r="2.2" fill="#E6CCA0" opacity="0.36" />
          <circle cx="1650" cy="670" r="2.0" fill="#F0D8B4" opacity="0.38" />
          <circle cx="1823" cy="574" r="2.1" fill="#D4B07A" opacity="0.37" />
          <circle cx="67" cy="980" r="2.1" fill="#C8A265" opacity="0.33" />
          <circle cx="240" cy="880" r="2.3" fill="#D4B07A" opacity="0.36" />
          <circle cx="407" cy="1015" r="2.4" fill="#C8A265" opacity="0.38" />
          <circle cx="600" cy="910" r="2.0" fill="#F0D8B4" opacity="0.31" />
          <circle cx="845" cy="898" r="2.1" fill="#E6CCA0" opacity="0.32" />
          <circle cx="1020" cy="990" r="2.3" fill="#C8A265" opacity="0.35" />
          <circle cx="1222" cy="989" r="2.0" fill="#D4B07A" opacity="0.36" />
          <circle cx="1380" cy="860" r="2.2" fill="#F0D8B4" opacity="0.34" />
          <circle cx="1514" cy="864" r="2.1" fill="#D4B07A" opacity="0.37" />
          <circle cx="1766" cy="1036" r="2.3" fill="#C8A265" opacity="0.31" />
        </g>

        <g id="sand-near" filter="url(#blur-near)">
          <circle cx="140" cy="70" r="2.8" fill="#F0D8B4" opacity="0.34" />
          <circle cx="259" cy="140" r="2.9" fill="#E6CCA0" opacity="0.32" />
          <circle cx="440" cy="301" r="2.7" fill="#E6CCA0" opacity="0.30" />
          <circle cx="650" cy="120" r="3.2" fill="#D4B07A" opacity="0.35" />
          <circle cx="896" cy="48" r="3.0" fill="#C8A265" opacity="0.36" />
          <circle cx="1120" cy="190" r="2.8" fill="#F0D8B4" opacity="0.33" />
          <circle cx="1357" cy="206" r="3.1" fill="#D4B07A" opacity="0.38" />
          <circle cx="1710" cy="110" r="2.9" fill="#C8A265" opacity="0.35" />
          <circle cx="81" cy="539" r="3.0" fill="#E6CCA0" opacity="0.32" />
          <circle cx="340" cy="460" r="3.5" fill="#F0D8B4" opacity="0.40" />
          <circle cx="520" cy="620" r="2.8" fill="#D4B07A" opacity="0.34" />
          <circle cx="721" cy="586" r="3.1" fill="#E6CCA0" opacity="0.31" />
          <circle cx="924" cy="485" r="3.2" fill="#C8A265" opacity="0.37" />
          <circle cx="1180" cy="520" r="3.5" fill="#F0D8B4" opacity="0.39" />
          <circle cx="1363" cy="682" r="3.1" fill="#C8A265" opacity="0.33" />
          <circle cx="1598" cy="491" r="2.9" fill="#E6CCA0" opacity="0.32" />
          <circle cx="1820" cy="440" r="2.7" fill="#D4B07A" opacity="0.36" />
          <circle cx="71" cy="935" r="2.8" fill="#E6CCA0" opacity="0.34" />
          <circle cx="320" cy="820" r="3.2" fill="#F0D8B4" opacity="0.38" />
          <circle cx="624" cy="901" r="3.3" fill="#C8A265" opacity="0.36" />
          <circle cx="820" cy="980" r="2.8" fill="#D4B07A" opacity="0.35" />
          <circle cx="1045" cy="843" r="3.0" fill="#C8A265" opacity="0.36" />
          <circle cx="1200" cy="774" r="3.2" fill="#D4B07A" opacity="0.32" />
          <circle cx="1450" cy="960" r="3.5" fill="#F0D8B4" opacity="0.42" />
          <circle cx="1583" cy="1043" r="3.4" fill="#E6CCA0" opacity="0.40" />
          <circle cx="1810" cy="890" r="2.9" fill="#C8A265" opacity="0.35" />
        </g>
      </defs>

      <style dangerouslySetInnerHTML={{ __html: particleStyles }} />

      <g className="float-1">
        <g className="layer-slow">
          <use href="#sand-far" x="0" y="0" />
          <use href="#sand-far" x="-1920" y="0" />
        </g>
      </g>

      <g className="float-2">
        <g className="layer-mid">
          <use href="#sand-mid" x="0" y="0" />
          <use href="#sand-mid" x="-1920" y="0" />
        </g>
      </g>

      <g className="float-3">
        <g className="layer-near">
          <use href="#sand-near" x="0" y="0" />
          <use href="#sand-near" x="-1920" y="0" />
        </g>
      </g>
    </svg>
  );
}
