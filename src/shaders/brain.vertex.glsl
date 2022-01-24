uniform vec3 uPointer;

varying vec3 vColor;

void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

  float d = distance(uPointer, position);
  float c = smoothstep(0.2, 0.15, d);
  vColor = vec3(c);
}
