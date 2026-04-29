import { TransitionDefinition } from "./types";

export const quantumSliceTransition = {
  key: "quantum-slice",
  label: "Quantum Slice",
  visibleInValidator: true,
  draw: (api, context) => api.drawQuantumSlice(context)
} as const satisfies TransitionDefinition<"quantum-slice">;
