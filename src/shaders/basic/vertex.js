export default `

attribute vec3 a_position;
uniform mat4 u_modelTransform;
uniform mat4 u_worldViewProjection;

void main(){
    vec4 worldPosition4 = u_modelTransform * vec4(a_position, 1.0);
    gl_Position = u_worldViewProjection * worldPosition4;
}

`;