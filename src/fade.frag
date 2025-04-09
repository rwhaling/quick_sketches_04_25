precision highp float;

// texcoords from the vertex shader
varying vec2 vTexCoord;

// our texture coming from p5
uniform sampler2D tex0;

// fade strength parameter
uniform float fadeStrength;

void main() {
  vec2 uv = vTexCoord;
  
  // Simply sample the texture at the current UV coordinate
  vec4 texColor = texture2D(tex0, uv);

  vec3 fadeColor = vec3(fadeStrength, fadeStrength, fadeStrength);
  // Apply the fade strength directly to the color
  vec3 fadedColor = texColor.rgb + fadeColor;
  
  gl_FragColor = vec4(fadedColor, texColor.a);
}