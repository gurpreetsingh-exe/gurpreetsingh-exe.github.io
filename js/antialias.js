const texture_draw = `#version 300 es
precision mediump float;

in vec2 uv;
in vec3 direction;
uniform sampler2D u_texture;
uniform sampler2D u_depth;
uniform mat4 model;
uniform mat4 projection;
uniform mat4 view;
uniform vec3 ray_origin;
uniform vec4 viewport;

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

// vec2 ray_sphere_intersection(vec3 origin, vec3 direction, vec4 sphere) {
//     vec3 center = sphere.xyz;
//     float radius = sphere.w;
//     vec3 v = origin - center;

//     float a = 1.0f;
//     float b = 2.0f * dot(v, direction);
//     float c = dot(v, v) - radius * radius;
//     float d = b * b - 4.0f * a * c;

//     if (d > 0.0f) {
//         float s = sqrt(d);
//         float near = max(0.0f, (-b - s) / (2.0f * a));
//         float far = (-b + s) / (2.0f * a);

//         if (far >= 0.0f) {
//             return vec2(near, far - near);
//         }
//     }

//     return vec2(10000.0f, 0.0f);
// }

vec2 ray_sphere_intersection(vec3 r0, vec3 rd, vec4 sphere) {
    vec3 s0 = sphere.xyz;
    float sr = sphere.w;
    float a = dot(rd, rd);
    vec3 s0_r0 = r0 - s0;
    float b = 2.0 * dot(rd, s0_r0);
    float c = dot(s0_r0, s0_r0) - (sr * sr);
    float disc = b * b - 4.0 * a * c;
    if (disc < 0.0) {
        return vec2(-1.0, -1.0);
    } else {
        return vec2(-b - sqrt(disc), -b + sqrt(disc)) / (2.0 * a);
    }
}

float depth_fix_range(float depth) {
    return ((gl_DepthRange.diff * depth) + gl_DepthRange.near + gl_DepthRange.far) / 2.0;
}

float get_depth(float depth) {
    return (2.0 * depth - gl_DepthRange.near - gl_DepthRange.far) /
        (gl_DepthRange.far - gl_DepthRange.near);
}

void main() {
    vec4 ndc;
    ndc.xy = ((2.0 * gl_FragCoord.xy) - (2.0 * viewport.xy)) / (viewport.zw) - 1.0f;
    ndc.z = (2.0 * gl_FragCoord.z - gl_DepthRange.near - gl_DepthRange.far) /
        (gl_DepthRange.far - gl_DepthRange.near);
    ndc.w = 1.0;

    vec4 clip_pos = ndc / gl_FragCoord.w;
    vec3 direction = vec3(inverse(view) * inverse(projection) * clip_pos);
    float depth = texture(u_depth, uv).x;

    vec2 hit = ray_sphere_intersection(ray_origin, normalize(direction),
        vec4(0.0f, 0.0f, 0.0f, 0.05f));
    float t = hit.y;
    float new_depth = min(depth - hit.x, hit.y);
    gl_FragDepth = new_depth;

    ivec2 size_ = textureSize(u_texture, 0);
    vec2 size = vec2(size_.x, size_.y);
    fragColor = vec4(fxaa(u_texture, 1.0f / size), 1.0f);
    // fragColor = vec4(vec3(ray_origin + direction * t), 1.0);
}
`;
