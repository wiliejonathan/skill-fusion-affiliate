export default function BrandLogo({compact=false}:{compact?:boolean}){
  return <span className={compact?"sf-logo sf-logo-compact":"sf-logo"}>
    <span className="sf-logo-mark" aria-hidden="true">
      <svg viewBox="0 0 64 64" role="img">
        <circle cx="32" cy="32" r="27" className="sf-ring"/>
        <path d="M43 18c-3.5-3.8-8-5.7-13.2-5.7-8.8 0-14.8 4.8-14.8 11.5 0 5.6 4.1 8.9 12.8 11.4l6.5 1.8c5.1 1.5 7.2 3.1 7.2 5.8 0 3.4-3.4 5.7-8.5 5.7-5.8 0-10.5-2.2-14.3-6.5" className="sf-stroke sf-stroke-a"/>
        <path d="M47.5 15.5c-8.1 4.7-13 10.8-14.7 18.4-1.5 6.7.2 12.6 5.2 17.8" className="sf-stroke sf-stroke-b"/>
      </svg>
    </span>
    <span className="sf-logo-copy">
      <strong>Skill Fusion</strong>
      {!compact?<small>Elevate your skills. Expand your horizons.</small>:null}
    </span>
  </span>;
}
