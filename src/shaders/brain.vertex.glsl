uniform vec3 uPointer;
uniform float uHover;

varying vec3 vColor;

#define colorA vec3(250.0, 235.0, 239.0) / 255.0
#define colorB vec3(51.0, 61.0, 121.0) / 255.0

void main() {
  // First, calculate `mvPosition` to get the distance between the instance and the
  // projected point `uPointer`.
  vec4 mvPosition = vec4(position, 1.0);
  mvPosition = instanceMatrix * mvPosition;

  // Distance between the point projected from the mouse and each instance
  float d = distance(uPointer, mvPosition.xyz);

  // Define the color depending on the above value
  float c = smoothstep(0.45, 0.1, d);

  float scale = 1.0 + c*6.0;

  // Re-define `mvPosition` updating the scale.
  mvPosition = instanceMatrix * vec4(position*scale, 1.0);

  gl_Position = projectionMatrix * modelViewMatrix * mvPosition;

  vColor = mix(colorA, colorB, c);
}
