const texture_draw = `#version 300 es
precision mediump float;

in vec2 uv;
uniform sampler2D u_texture;

#define g_mulReduceReciprocal 16.0f
#define g_minReduceReciprocal 32.0f

#define luma_threshold 0.5f
#define u_mulReduce 1.0 / g_mulReduceReciprocal
#define u_minReduce 1.0 / g_minReduceReciprocal
#define u_maxSpan 8.0f

out vec4 fragColor;

vec3 fxaa(sampler2D tex, vec2 texel_step) {
  vec3 rgbM = texture(tex, uv).rgb;

  vec3 rgbNW = textureOffset(tex, uv, ivec2(-1, 1)).rgb;
  vec3 rgbNE = textureOffset(tex, uv, ivec2(1, 1)).rgb;
  vec3 rgbSW = textureOffset(tex, uv, ivec2(-1, -1)).rgb;
  vec3 rgbSE = textureOffset(tex, uv, ivec2(1, -1)).rgb;

  const vec3 toLuma = vec3(0.299, 0.587, 0.114);

  float lumaNW = dot(rgbNW, toLuma);
  float lumaNE = dot(rgbNE, toLuma);
  float lumaSW = dot(rgbSW, toLuma);
  float lumaSE = dot(rgbSE, toLuma);
  float lumaM = dot(rgbM, toLuma);

  float lumaMin = min(lumaM, min(min(lumaNW, lumaNE), min(lumaSW, lumaSE)));
  float lumaMax = max(lumaM, max(max(lumaNW, lumaNE), max(lumaSW, lumaSE)));

  if (lumaMax - lumaMin <= lumaMax * luma_threshold) {
    return rgbM;
  }

  vec2 samplingDirection;
  samplingDirection.x = -((lumaNW + lumaNE) - (lumaSW + lumaSE));
  samplingDirection.y = ((lumaNW + lumaSW) - (lumaNE + lumaSE));

  float samplingDirectionReduce = max(
      (lumaNW + lumaNE + lumaSW + lumaSE) * 0.25 * u_mulReduce, u_minReduce);

  float minSamplingDirectionFactor =
      1.0 / (min(abs(samplingDirection.x), abs(samplingDirection.y)) +
             samplingDirectionReduce);
  samplingDirection = clamp(samplingDirection * minSamplingDirectionFactor,
                            vec2(-u_maxSpan), vec2(u_maxSpan)) *
                      texel_step;

  vec3 rgbSampleNeg =
      texture(tex, uv + samplingDirection * (1.0 / 3.0 - 0.5)).rgb;
  vec3 rgbSamplePos =
      texture(tex, uv + samplingDirection * (2.0 / 3.0 - 0.5)).rgb;

  vec3 rgbTwoTab = (rgbSamplePos + rgbSampleNeg) * 0.5;

  vec3 rgbSampleNegOuter =
      texture(tex, uv + samplingDirection * (0.0 / 3.0 - 0.5)).rgb;
  vec3 rgbSamplePosOuter =
      texture(tex, uv + samplingDirection * (3.0 / 3.0 - 0.5)).rgb;

  vec3 rgbFourTab =
      (rgbSamplePosOuter + rgbSampleNegOuter) * 0.25 + rgbTwoTab * 0.5;

  float lumaFourTab = dot(rgbFourTab, toLuma);
  vec3 color =
      (lumaFourTab < lumaMin || lumaFourTab > lumaMax) ? rgbTwoTab : rgbFourTab;
  return color;
}

void main() {
  ivec2 size_ = textureSize(u_texture, 0);
  vec2 size = vec2(size_.x, size_.y);
  fragColor = vec4(fxaa(u_texture, 1.0f / size), 1.0f);
}
`;
