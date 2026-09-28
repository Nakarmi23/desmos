import { signInShowcaseStyles } from "./sign-in-showcase.styles";

const styles = signInShowcaseStyles();

const WIDTH = 480;
const HEIGHT = 320;

// Two curves on a grid: the brand's name is a nod to graphing.
const CURVES = [
  (x: number) => 0.32 * Math.sin(x * 1.25) + 0.08 * Math.sin(x * 3.4),
  (x: number) => 0.22 * Math.cos(x * 0.8 + 1.2) - 0.1,
];
const X_RANGE = 2 * Math.PI;

/** SVG coordinates of `f` at `x`, for `x` in [0, X_RANGE] and `f` in [-0.5, 0.5]. */
function toSvg(f: (x: number) => number, x: number): [number, number] {
  return [(x / X_RANGE) * WIDTH, (0.5 - f(x)) * HEIGHT];
}

function plot(f: (x: number) => number): string {
  const steps = 120;
  return Array.from({ length: steps + 1 }, (_, i) => {
    const [px, py] = toSvg(f, (i / steps) * X_RANGE);
    return `${i === 0 ? "M" : "L"}${px.toFixed(1)},${py.toFixed(1)}`;
  }).join(" ");
}

const POINTS = [0.9, 2.6, 4.4].map((x) => toSvg(CURVES[0], x));

/**
 * The sign-in page's brand panel: the Desmos mark, what the app is for, and
 * a decorative plot. Wide screens only; the page shows the mark alone on
 * small ones.
 */
export function SignInShowcase() {
  return (
    <aside className={styles.root()}>
      <div className={styles.brand()}>
        <span aria-hidden className={styles.glyph()}>
          D
        </span>
        <span className={styles.brandText()}>
          <span className={styles.brandName()}>Desmos</span>
          <span className={styles.brandTagline()}>Dynamic Admin System</span>
        </span>
      </div>

      <svg
        aria-hidden
        // A margin so the strokes' round caps and the points aren't clipped.
        viewBox={`-8 -8 ${WIDTH + 16} ${HEIGHT + 16}`}
        className={styles.plot()}
      >
        <defs>
          <pattern
            id="sign-in-grid"
            width={WIDTH / 12}
            height={HEIGHT / 8}
            patternUnits="userSpaceOnUse"
          >
            <path
              d={`M ${WIDTH / 12} 0 L 0 0 0 ${HEIGHT / 8}`}
              className={styles.gridLine()}
            />
          </pattern>
        </defs>
        <rect width={WIDTH} height={HEIGHT} fill="url(#sign-in-grid)" />
        <line
          x1={0}
          x2={WIDTH}
          y1={HEIGHT / 2}
          y2={HEIGHT / 2}
          className={styles.axis()}
        />
        <path
          d={plot(CURVES[1])}
          pathLength={1}
          className={styles.curve({ tone: "muted" })}
        />
        <path
          d={plot(CURVES[0])}
          pathLength={1}
          className={styles.curve({ tone: "bold" })}
        />
        {POINTS.map(([cx, cy]) => (
          <circle key={cx} cx={cx} cy={cy} r={5} className={styles.point()} />
        ))}
      </svg>

      <div className={styles.copy()}>
        <p className={styles.headline()}>
          Browse and act on your data, all in one place.
        </p>
        <p className={styles.subline()}>
          Tables, searches and bulk actions for every module you build.
        </p>
      </div>
    </aside>
  );
}
