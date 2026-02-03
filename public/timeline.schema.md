# Timeline schema notes

## Automation easing
Use the `ease` field on automation entries to control interpolation. Unknown values fall back to linear.

```
linear: no easing, constant rate
easeInOutQuad: smooth ease-in/out, gentle accel/decel
easeInQuad: slow start, quadratic acceleration
easeOutQuad: fast start, quadratic deceleration
easeInOutCubic: smooth ease-in/out, cubic curve
easeInCubic: slow start, cubic acceleration
easeOutCubic: fast start, cubic deceleration
easeInOutQuart: smooth ease-in/out, steeper than cubic
easeInOutQuint: smooth ease-in/out, steeper than quart
easeInSine: sine-based gentle ease-in
easeOutSine: sine-based gentle ease-out
easeInOutSine: sine-based gentle ease-in/out
easeInExpo: strong exponential ease-in
easeOutExpo: strong exponential ease-out
easeInOutExpo: strong exponential ease-in/out
easeInBack: overshoot at start, then accelerate
easeOutBack: overshoot at end, then settle
easeInOutBack: overshoot at both ends
easeOutBounce: bouncy settle at end
easeOutElastic: elastic overshoot at end
easeInOutCirc: circular ease-in/out with tight curve
```

Example:

```json
{
  "path": "params.speed",
  "from": 0.6,
  "to": 1.2,
  "t0": 10,
  "t1": 14,
  "ease": "easeInOutCubic"
}
```
