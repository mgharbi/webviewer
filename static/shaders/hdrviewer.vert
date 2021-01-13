varying vec2 vUv;
void main() {
  // vUv = vec2(uv.x*twidth, uv.y*theight);
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
