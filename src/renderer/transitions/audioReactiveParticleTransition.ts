import { TransitionDefinition } from "./types";

export const audioReactiveParticleTransition: TransitionDefinition<"audio-reactive-particle"> = {
  key: "audio-reactive-particle",
  label: "Audio-reactive Particle",
  visibleInValidator: true,
  draw: (api, context) => api.drawAudioReactiveParticle(context),
  drawMobile: (api, context) => api.drawMobileAudioReactiveParticle(context)
};
