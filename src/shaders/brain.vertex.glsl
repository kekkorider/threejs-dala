uniform vec3 uPointer;
uniform float uRandom;

varying vec3 vColor;

#define colorA vec3(250.0, 235.0, 239.0) / 255.0
#define colorB vec3(51.0, 61.0, 121.0) / 255.0

#define PI 3.14159265359

#pragma glslify: rotate = require(./modules/rotate.glsl)

void main() {
  // First, calculate `mvPosition` to get the distance between the instance and the
  // projected point `uPointer`.
  vec4 mvPosition = vec4(position, 1.0);
  mvPosition = instanceMatrix * mvPosition;

  // Distance between the point projected from the mouse and each instance
  float d = distance(uPointer, mvPosition.xyz);

  // Define the color depending on the above value
  float c = smoothstep(0.45, 0.1, d);

  float scale = 1.5 + c*9.0;
  vec3 pos = position;
  pos *= scale;
  pos.xz *= rotate(PI * c * uRandom);
  pos.xy *= rotate(PI * c * uRandom);

  // Re-define `mvPosition` with the scaled and rotated position.
  mvPosition = instanceMatrix * vec4(pos, 1.0);

  gl_Position = projectionMatrix * modelViewMatrix * mvPosition;

  vColor = mix(colorA, colorB, c);
}
