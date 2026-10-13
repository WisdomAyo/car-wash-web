type TrafficProps = {
  setting?: "city" | "care"
  bridge?: "link" | "mainland"
}

function StreetCar({ silver = false }: { silver?: boolean }) {
  return (
    <g>
      <path
        d="m-33 1 7-12h26L17 0l18 4q7 2 7 10h-79q-3-9 4-13Z"
        fill={silver ? "var(--scene-paper)" : "var(--lagos-bridge-dark)"}
      />
      <path d="m-21-7-4 9h24V-7Zm24 0v9h17L9-7Z" fill="var(--lagos-glass)" />
      <path d="M-28 7h58" stroke="var(--lagos-cloud)" strokeOpacity=".25" />
      <circle cx="-22" cy="14" r="7" fill="var(--navy)" />
      <circle cx="26" cy="14" r="7" fill="var(--navy)" />
      <circle cx="-22" cy="14" r="3" fill="var(--lagos-building-light)" />
      <circle cx="26" cy="14" r="3" fill="var(--lagos-building-light)" />
      <path d="M34 7h5" stroke="var(--lagos-cloud)" strokeWidth="3" />
    </g>
  )
}

export default function LagosTraffic({
  setting = "city",
  bridge = "link",
}: TrafficProps) {
  return (
    <g className={`film-traffic traffic-${setting}`} aria-hidden="true">
      <g
        className="road-car road-car-east"
        transform={`translate(330 ${setting === "city" ? 457 : 432})`}
      >
        <StreetCar silver />
      </g>
      <g
        className="road-car road-car-west"
        transform={`translate(600 ${setting === "city" ? 484 : 461})`}
      >
        <g transform="scale(-1 1)">
          <StreetCar />
        </g>
      </g>
      {setting === "city" && (
        <g className={`link-bridge-traffic bridge-route-${bridge}`}>
          {[0, 1, 2].map((i) => (
            <g className={`bridge-car bridge-car-${i}`} key={i}>
              <g transform="scale(.38)">
                <StreetCar silver={i !== 1} />
              </g>
            </g>
          ))}
        </g>
      )}
    </g>
  )
}
