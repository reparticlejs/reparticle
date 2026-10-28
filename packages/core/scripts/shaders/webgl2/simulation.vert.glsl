#version 300 es
precision highp float;
out vec2 vTexCoord;
// A full-screen triangle runs the simulation once for every output texel.
void main() {
 vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
 vTexCoord = p;
 gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}
