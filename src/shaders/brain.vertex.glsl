uniform vec3 uPointer;
uniform float uHover;

varying vec3 vColor;

#define colorA vec3(250.0, 235.0, 239.0) / 255.0
#define colorB vec3(51.0, 61.0, 121.0) / 255.0

void main() {
  // Distance between the point projected from the mouse and each vertex
  float d = distance(uPointer, position);

  // Define the color depending on the above value
  float c = smoothstep(0.35, 0.1, d) * uHover;

  vec3 pos = position;
  // Scale the position based on the distance
  pos = pos * (1.0 + c*0.2);

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);

  vColor = mix(colorB, colorA, c);
}
