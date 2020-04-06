export default `

attribute vec3 a_position;
uniform mat4 worldViewProjection;

void main(){
    vec4 worldPosition4 = vec4(a_position, 1.0);
    gl_Position = worldViewProjection*worldPosition4;
}


`;
