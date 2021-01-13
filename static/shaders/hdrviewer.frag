uniform sampler2D tDiffuse;
uniform float exposure;

varying vec2 vUv;

vec3 decode_pnghdr( const in vec4 color ) {
  vec4 rgbcolor = vec4( 0.0, 0.0, 0.0, 0.0 );
  if ( color.w > 0.0 ) {
    // pfsout hdr correction
    float f = pow(2.0, (255.0*color.w-(128.0) + 7.0));
    rgbcolor.xyz = color.xyz * f;
  }
  return rgbcolor.xyz;
}

void main() {
  vec4 color = texture2D(tDiffuse, vUv);
  /* color.xyz  = decode_pnghdr( color ); */
  /* float Y = dot(vec4(0.30, 0.59, 0.11, 0.0), color); */
  color = pow(color, vec4(2.2));  // de-gamma
  color *= pow(2.0, exposure);
  color = pow(color, vec4(1.0/2.2));  // gamma
  color = clamp(color, vec4(0), vec4(1));
  gl_FragColor = vec4(color.xyz, 1.0);
}
