const planet = `#version 300 es
precision mediump float;

in vec2 uv;
in vec3 direction;
uniform mat4 model;
uniform mat4 projection;
uniform mat4 view;
uniform vec3 ray_origin;
uniform vec4 viewport;
uniform float time;

out vec4 fragColor;

const int num_in_scattering_points = 12;
const int num_optical_depth_points = 12;
// const vec3 sun_dir = normalize(vec3(-10));
const float atmosphere_radius = 1.15f;
const float planet_radius = 1.0f;
const vec3 planet_center = vec3(0);

vec3 ro = vec3(0.0f, 0.0f, 80.0f);
vec3 target = vec3(0.0, 0.2, 0.0);

const float speed = 0.1;
const vec3 wavelength = vec3(700, 530, 440);
const float scattering_strength = 10.0f;
const vec3 scatter = pow(vec3(400.0f) / wavelength, vec3(4.0f)) * scattering_strength;


vec2 ray_sphere_intersection(vec3 r0, vec3 rd, vec4 sphere) {
    vec3 s0 = sphere.xyz;
    float sr = sphere.w;
    float a = dot(rd, rd);
    vec3 s0_r0 = r0 - s0;
    float b = 2.0 * dot(rd, s0_r0);
    float c = dot(s0_r0, s0_r0) - (sr * sr);
    float disc = b * b - 4.0 * a * c;
    if (disc > 0.0) {
        float s = sqrt(disc);
        float near = max(0.0, -b - s) / (2.0f * a);
        // float near = (-b - s) / (2.0f * a);
        float far = (-b + s) / (2.0f * a);
        if (far >= 0.0) {
            return vec2(near, far - near);
        }
    }
    return vec2(-1, 0);
}

float density_at_point(vec3 point) {
    float height_above_surface = length(point - planet_center) - planet_radius;
    float height01 = height_above_surface / (atmosphere_radius - planet_radius);
    float local_density = exp(-height01 * 1.0f) * (1.0 - height01);
    return local_density;
}

float optical_depth(vec3 ro, vec3 rd, float ray_length) {
    vec3 point = ro;
    float step_size = ray_length / float(num_optical_depth_points - 1);
    float optical_depth = 0.0f;

    for (int i = 0; i < num_optical_depth_points; ++i) {
        float local_density = density_at_point(point);
        optical_depth += local_density * step_size;
        point += rd * step_size;
    }

    return optical_depth;
}


vec3 calculate_light(vec3 ro, vec3 rd, float ray_length, vec3 orig_col) {
    vec3 in_scatter_point = ro;
    float step_size = ray_length / float(num_in_scattering_points - 1);
    vec3 in_scattered_light = vec3(0.0f);
    float view_ray_optical_depth = 0.0f;

    // vec3 sun_dir = normalize(vec3(time, 1.0f, time * 0.7f));
    // vec3 sun_dir = normalize(vec3(-10));
    float t = time * speed;
    vec3 sun_pos = vec3(cos(t), sin(t * 0.7), sin(t));
    vec3 sun_dir = normalize(planet_center - sun_pos);
    for (int i = 0; i < num_in_scattering_points; ++i) {
        float sun_ray_length = ray_sphere_intersection(
            in_scatter_point, sun_dir, vec4(planet_center, atmosphere_radius)).y;
        float sun_ray_optical_depth = optical_depth(in_scatter_point,
            sun_dir, sun_ray_length);
        view_ray_optical_depth = optical_depth(in_scatter_point, -rd,
            step_size * float(i));
        vec3 transmittance = exp(-(sun_ray_optical_depth + view_ray_optical_depth) * scatter);
        float local_density = density_at_point(in_scatter_point);

        in_scattered_light += local_density * transmittance * scatter * step_size;
        in_scatter_point += rd * step_size;
    }

    float orig_col_transmittance = exp(-view_ray_optical_depth);
    return orig_col * orig_col_transmittance + in_scattered_light;
}

// void main() {
//     vec4 ndc;
//     ndc.xy = ((2.0 * gl_FragCoord.xy) - (2.0 * viewport.xy)) / (viewport.zw) - 1.0f;
//     ndc.z = (2.0 * gl_FragCoord.z - gl_DepthRange.near - gl_DepthRange.far) /
//         (gl_DepthRange.far - gl_DepthRange.near);
//     ndc.w = 1.0;

//     vec4 clip_pos = ndc / gl_FragCoord.w;
//     vec3 direction = ray_origin - vec3(inverse(view) * inverse(projection) * clip_pos);

//     vec2 dst_to_planet = ray_sphere_intersection(ray_origin, direction,
//         vec4(0.0f, 0.0f, 0.0f, planet_radius));
//     vec3 orig = ray_origin + direction * dst_to_planet.x;

//     vec2 hit = ray_sphere_intersection(ray_origin, direction,
//         vec4(0.0f, 0.0f, 0.0f, atmosphere_radius));

//     float dst_to_atmosphere = hit.x;
//     float dst_through_atmosphere = min(hit.y, dst_to_planet.x - dst_to_atmosphere);

//     if (dst_through_atmosphere > 0.0f) {
//         float epsilon = 0.0001f;
//         vec3 position = ray_origin + direction * (dst_to_atmosphere + epsilon);
//         float light = exp(-calculate_light(position, direction, dst_through_atmosphere - epsilon * 2.0f));
//         fragColor = vec4(vec3(orig * (1.0f - light) + light), 1.0f);
//         // fragColor = vec4(dst_through_atmosphere * vec3(1), 1.0f);
//         return;
//     }

//     fragColor = vec4(vec3(orig), 1.0f);
// }

void main()
{
    vec3 nearCoord = vec3(2.0 * gl_FragCoord.xy / viewport.zw - 1.0, 0.0);
    nearCoord.x *= viewport.z / viewport.w;

    vec3 front = normalize(ro - target);
    vec3 right = normalize(cross(vec3(0.0, 1.0, 0.0), front));
    vec3 up = cross(front, right);
    vec3 rd = normalize(right * nearCoord.x + up * nearCoord.y - front * 1.8);

    vec4 ndc;
    ndc.xy = ((2.0 * gl_FragCoord.xy) - (2.0 * viewport.xy)) / (viewport.zw) - 1.0f;
    ndc.z = (2.0 * gl_FragCoord.z - gl_DepthRange.near - gl_DepthRange.far) /
        (gl_DepthRange.far - gl_DepthRange.near);
    ndc.w = 1.0;

    vec4 clip_pos = ndc / gl_FragCoord.w;
    rd = normalize(vec3(inverse(view) * inverse(projection) * clip_pos));

    vec2 dst_to_planet = ray_sphere_intersection(ro, rd,
        vec4(0.0f, 0.0f, 0.0f, planet_radius));
    vec3 p = (ro + rd * dst_to_planet.x) * float(dst_to_planet.x > 0.0f);
    vec3 n = normalize(p - planet_center);
    float t = time * speed;
    vec3 sun_pos = vec3(cos(t), sin(t * 0.7), sin(t));
    vec3 sun_dir = normalize(planet_center - sun_pos);
    vec3 orig = vec3(clamp(dot(sun_dir, n), 0.0, 1.0));

    vec2 hit = ray_sphere_intersection(ro, rd,
        vec4(0.0f, 0.0f, 0.0f, atmosphere_radius));

    float dst_to_atmosphere = hit.x;
    float dst_through_atmosphere = max(hit.y, dst_to_planet.x - dst_to_atmosphere);

    vec3 color = orig;
    if (dst_through_atmosphere > 0.0f) {
        float epsilon = 0.00001f;
        vec3 position = ro + rd * (dst_to_atmosphere + epsilon);
        vec3 light = calculate_light(position, rd, dst_through_atmosphere - epsilon * 2.0f, orig);
        color = light;
    }

    fragColor = vec4(color, 1.0);
}
`;
