'use strict';
// Flache Icons für die Spielauswahl (64×64, Farben wie die Seite: Blau gegen Rot)
// bg = Hintergrund der Kachel
const ICONS=(()=>{
  const K='#1c1c1e',B='#0a9fe0',R='#ff4a3d',Y='#ffb000',G='#2bb673',W='#fff',S='#c7c7cc';
  const svg=b=>`<svg viewBox="0 0 64 64" aria-hidden="true">${b}</svg>`;
  return{
    vier:{bg:'#d9f0fb',svg:svg(`<rect x="8" y="14" width="48" height="44" rx="8" fill="${K}"/>
      <g fill="${W}"><circle cx="20" cy="26" r="5"/><circle cx="32" cy="26" r="5"/><circle cx="44" cy="26" r="5"/><circle cx="20" cy="38" r="5"/><circle cx="44" cy="38" r="5"/></g>
      <circle cx="32" cy="38" r="5" fill="${R}"/><circle cx="20" cy="50" r="5" fill="${B}"/><circle cx="32" cy="50" r="5" fill="${R}"/><circle cx="44" cy="50" r="5" fill="${B}"/>
      <circle cx="44" cy="7" r="5" fill="${R}"/>`)},
    schiffe:{bg:'#d9f0fb',svg:svg(`<path d="M30 10v20" stroke="${K}" stroke-width="3"/><path d="M31 11l12 5-12 5z" fill="${R}"/>
      <rect x="22" y="26" width="18" height="8" rx="2" fill="${W}"/>
      <path d="M8 34h48l-7 12H15z" fill="${K}"/>
      <path d="M4 53c5 0 5-4 10-4s5 4 10 4 5-4 10-4 5 4 10 4 5-4 10-4 5 4 6 4" fill="none" stroke="${B}" stroke-width="4" stroke-linecap="round"/>`)},
    pong:{bg:'#e2e6ee',svg:svg(`<rect x="6" y="8" width="52" height="48" rx="8" fill="${K}"/>
      <path d="M32 14v36" stroke="#48484a" stroke-width="2" stroke-dasharray="4 4"/>
      <rect x="12" y="18" width="5" height="16" rx="2.5" fill="${B}"/><rect x="47" y="30" width="5" height="16" rx="2.5" fill="${R}"/>
      <circle cx="38" cy="26" r="4" fill="${W}"/>`)},
    tron:{bg:'#e2e6ee',svg:svg(`<rect x="6" y="8" width="52" height="48" rx="8" fill="${K}"/>
      <path d="M12 44h14V22h10" fill="none" stroke="${B}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M52 20H40v24h-8" fill="none" stroke="${R}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
      <rect x="34" y="18" width="7" height="7" rx="2" fill="${W}"/><rect x="27" y="40" width="7" height="7" rx="2" fill="${W}"/>`)},
    duell:{bg:'#fff0c7',svg:svg(`<path d="M32 6l6.5 13.2 14.5 2.1-10.5 10.2 2.5 14.5L32 39.2 19 46l2.5-14.5L11 21.3l14.5-2.1z" fill="${Y}" stroke="${Y}" stroke-width="5" stroke-linejoin="round" transform="translate(0 6)"/>
      <circle cx="32" cy="33" r="7" fill="${W}"/><circle cx="32" cy="33" r="3" fill="${K}"/>`)},
    ssp:{bg:'#ffe1dc',svg:svg(`<rect x="30" y="8" width="24" height="30" rx="3" fill="${W}" transform="rotate(12 42 23)"/>
      <path d="M36 17h12M35 23h12M34 29h8" stroke="${S}" stroke-width="2.5" stroke-linecap="round" transform="rotate(12 42 23)"/>
      <path d="M27 42L44 8M37 42L20 8" stroke="${K}" stroke-width="4.5" stroke-linecap="round"/>
      <circle cx="32" cy="32" r="2.5" fill="${W}"/>
      <circle cx="23" cy="49" r="7" fill="none" stroke="${R}" stroke-width="5"/><circle cx="41" cy="49" r="7" fill="none" stroke="${R}" stroke-width="5"/>`)},
    tau:{bg:'#fde6d2',svg:svg(`<path d="M10 32c6-4 9 4 15 0s9 4 15 0 9 4 14 0" fill="none" stroke="#b5793f" stroke-width="6" stroke-linecap="round"/>
      <rect x="29" y="20" width="6" height="24" rx="3" fill="${K}"/>
      <circle cx="9" cy="32" r="7" fill="${B}"/><circle cx="55" cy="32" r="7" fill="${R}"/>`)},
    kaestchen:{bg:'#ece3fa',svg:svg(`<rect x="12" y="12" width="20" height="20" fill="${B}"/><rect x="32" y="32" width="20" height="20" fill="${R}"/>
      <path d="M12 12h40M12 32h40M12 52h40M12 12v40M32 12v40M52 12v40" stroke="${S}" stroke-width="3" stroke-linecap="round"/>
      <path d="M12 12h20v20H12zM32 32h20v20H32zM32 12h20" fill="none" stroke="${K}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
      <g fill="${K}"><circle cx="12" cy="12" r="4"/><circle cx="32" cy="12" r="4"/><circle cx="52" cy="12" r="4"/><circle cx="12" cy="32" r="4"/><circle cx="32" cy="32" r="4"/><circle cx="52" cy="32" r="4"/><circle cx="12" cy="52" r="4"/><circle cx="32" cy="52" r="4"/><circle cx="52" cy="52" r="4"/></g>`)},
    bombe:{bg:'#ffe1dc',svg:svg(`<circle cx="28" cy="38" r="18" fill="${K}"/><rect x="34" y="16" width="10" height="8" rx="2" fill="#48484a" transform="rotate(40 39 20)"/>
      <path d="M42 16c3-5 8-6 10-3" fill="none" stroke="#b5793f" stroke-width="3" stroke-linecap="round"/>
      <path d="M54 6l1.5 4.5L60 12l-4.5 1.5L54 18l-1.5-4.5L48 12l4.5-1.5z" fill="${Y}"/>
      <circle cx="21" cy="31" r="4" fill="#48484a"/>`)},
    labyrinth:{bg:'#dcf3e3',svg:svg(`<rect x="8" y="8" width="48" height="48" rx="6" fill="${W}"/>
      <path d="M8 20h28M20 32h28M8 44h20M36 44v12M28 8v12M20 32v12" stroke="${K}" stroke-width="3.5" stroke-linecap="round"/>
      <rect x="8" y="8" width="48" height="48" rx="6" fill="none" stroke="${K}" stroke-width="3.5"/>
      <circle cx="14" cy="14" r="4" fill="${B}"/><path d="M46 48v-9l6 3-6 3" fill="${G}" stroke="${G}" stroke-width="1.5" stroke-linejoin="round"/>`)},
    gedanken:{bg:'#ece3fa',svg:svg(`<path d="M6 14a8 8 0 018-8h18a8 8 0 018 8v10a8 8 0 01-8 8H18l-8 6v-7a8 8 0 01-4-7z" fill="${B}"/>
      <path d="M58 32a8 8 0 00-8-8H32a8 8 0 00-8 8v10a8 8 0 008 8h14l8 6v-7a8 8 0 004-7z" fill="${R}"/>
      <path d="M15 19h16" stroke="${W}" stroke-width="4" stroke-linecap="round"/><path d="M33 37h16" stroke="${W}" stroke-width="4" stroke-linecap="round"/>`)},
    eier:{bg:'#fff0c7',svg:svg(`<path d="M32 6c8 0 14 12 14 20a14 14 0 01-28 0c0-8 6-20 14-20z" fill="${W}"/>
      <circle cx="27" cy="20" r="3" fill="${G}"/><circle cx="37" cy="28" r="4" fill="${G}"/><circle cx="28" cy="32" r="2.5" fill="${G}"/>
      <path d="M8 44h48a24 14 0 01-48 0z" fill="#b5793f"/><path d="M8 44h48" stroke="#8a5a2b" stroke-width="4" stroke-linecap="round"/>`)},
    zahlen:{bg:'#d9f0fb',svg:svg(`<g transform="rotate(-12 22 34)"><rect x="8" y="14" width="26" height="38" rx="5" fill="${W}"/><text x="21" y="42" text-anchor="middle" font-family="ui-rounded,system-ui,sans-serif" font-weight="800" font-size="22" fill="${B}">3</text></g>
      <g transform="rotate(10 42 32)"><rect x="29" y="10" width="26" height="38" rx="5" fill="${K}"/><text x="42" y="38" text-anchor="middle" font-family="ui-rounded,system-ui,sans-serif" font-weight="800" font-size="22" fill="${W}">8</text></g>`)},
    malen:{bg:'#ffe0ee',svg:svg(`<path d="M8 50c8-10 14 2 22-6s12-4 18-2" fill="none" stroke="${B}" stroke-width="4" stroke-linecap="round"/>
      <g transform="rotate(45 38 26)"><rect x="30" y="2" width="16" height="36" rx="2" fill="${Y}"/><rect x="30" y="2" width="16" height="8" rx="2" fill="#ff8fb1"/><rect x="30" y="9" width="16" height="3" fill="${S}"/><path d="M30 38h16l-8 12z" fill="#f5d6a8"/><path d="M35.5 44.5h5L38 50z" fill="${K}"/></g>`)},
    reversi:{bg:'#dcf3e3',svg:svg(`<rect x="8" y="8" width="48" height="48" rx="8" fill="${G}"/><path d="M32 8v48M8 32h48" stroke="#1f9058" stroke-width="2"/>
      <circle cx="20" cy="20" r="8" fill="${B}"/><circle cx="44" cy="20" r="8" fill="${R}"/><circle cx="20" cy="44" r="8" fill="${R}"/><circle cx="44" cy="44" r="8" fill="${B}"/>`)},
    maexchen:{bg:'#e2e6ee',svg:svg(`<g transform="rotate(-10 22 26)"><rect x="6" y="10" width="30" height="30" rx="7" fill="${W}" stroke="${K}" stroke-width="3"/><circle cx="21" cy="25" r="3.5" fill="${R}"/></g>
      <g transform="rotate(12 42 40)"><rect x="27" y="25" width="30" height="30" rx="7" fill="${K}"/><g fill="${W}"><circle cx="35" cy="33" r="3"/><circle cx="49" cy="47" r="3"/><circle cx="42" cy="40" r="3"/></g></g>`)},
    maulwurf:{bg:'#fde6d2',svg:svg(`<ellipse cx="32" cy="50" rx="26" ry="8" fill="#8a5a2b"/>
      <path d="M16 50V34a16 16 0 0132 0v16z" fill="#6e6e73"/>
      <circle cx="26" cy="32" r="2.5" fill="${K}"/><circle cx="38" cy="32" r="2.5" fill="${K}"/><ellipse cx="32" cy="39" rx="5" ry="3.5" fill="#ff8fb1"/>
      <g transform="rotate(-30 50 14)"><rect x="47" y="10" width="5" height="22" rx="2" fill="#b5793f"/><rect x="40" y="4" width="19" height="10" rx="3" fill="${R}"/></g>`)},
    codewort:{bg:'#dcf3e3',svg:svg(`<g><rect x="6" y="8" width="15" height="13" rx="3" fill="${G}"/><rect x="24.5" y="8" width="15" height="13" rx="3" fill="${W}"/><rect x="43" y="8" width="15" height="13" rx="3" fill="${W}"/>
      <rect x="6" y="25.5" width="15" height="13" rx="3" fill="${W}"/><rect x="24.5" y="25.5" width="15" height="13" rx="3" fill="${K}"/><rect x="43" y="25.5" width="15" height="13" rx="3" fill="${G}"/>
      <rect x="6" y="43" width="15" height="13" rx="3" fill="${W}"/><rect x="24.5" y="43" width="15" height="13" rx="3" fill="${G}"/><rect x="43" y="43" width="15" height="13" rx="3" fill="${W}"/></g>
      <path d="M10 15h7M48 50h6M10 50h7M29 15h7M48 15h6M10 32h7" stroke="${S}" stroke-width="2.5" stroke-linecap="round"/>`)},
    doppeldino:{bg:'#dcf3e3',svg:svg(`<g fill="${G}"><rect x="30" y="8" width="20" height="14" rx="2"/><rect x="22" y="20" width="18" height="18"/><rect x="12" y="26" width="10" height="8"/><rect x="40" y="26" width="5" height="4"/><rect x="24" y="38" width="5" height="8"/><rect x="33" y="38" width="5" height="6"/></g>
      <rect x="35" y="11" width="4" height="4" fill="${W}"/><rect x="44" y="17" width="6" height="2" fill="#1f9058"/>
      <path d="M4 54h56" stroke="${K}" stroke-width="3" stroke-linecap="round"/><rect x="50" y="40" width="5" height="14" rx="2" fill="${K}"/><rect x="46" y="44" width="4" height="3" rx="1" fill="${K}"/>`)},
    echo:{bg:'#fff0c7',svg:svg(`<path d="M30 6A26 26 0 006 30h24z" fill="${G}"/><path d="M34 6a26 26 0 0124 24H34z" fill="${R}"/><path d="M6 34a26 26 0 0024 24V34z" fill="${Y}"/><path d="M58 34a26 26 0 01-24 24V34z" fill="${B}"/>
      <circle cx="32" cy="32" r="9" fill="${K}"/>`)}
  };
})();
