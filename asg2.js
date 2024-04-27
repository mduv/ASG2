// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE =
    'attribute vec4 a_Position;\n' +
    'uniform float u_Size;\n' +
    'void main() {\n' +
    '  gl_Position = a_Position;\n' +
    '  gl_PointSize = u_Size;\n' +
    '}\n';

// Fragment shader program
var FSHADER_SOURCE =
    'precision mediump float;\n' +
    'uniform vec4 u_FragColor;\n' +  
    'void main() {\n' +
    '  gl_FragColor = u_FragColor;\n' +
    '}\n';

// Constants
const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;

// Global variables
let canvas;
let gl;
let a_Position;
let u_FragColor;
let u_Size;
let g_selectedType = POINT;
let g_selectedSides = 14;

function setupWebGL() {
    // Retrieve <canvas> element
    canvas = document.getElementById('webgl');

    // Get the rendering context for WebGL
    gl = canvas.getContext("webgl", { preseveDrawingBuffer: true }); // gl = getWebGLContext(canvas);
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }
}

function connectVariablesToGLSL(){
    // Initialize shaders
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to intialize shaders.');
        return;
    }

    // // Get the storage location of a_Position
    a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
        console.log('Failed to get the storage location of a_Position');
        return;
    }

    // Get the storage location of u_FragColor
    u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
    if (!u_FragColor) {
        console.log('Failed to get the storage location of u_FragColor');
        return;
    }

    // Get the storage location of u_Size
    u_Size = gl.getUniformLocation(gl.program, 'u_Size');
    if (!u_Size) {
        console.log('Failed to get the storage location of u_Size');
        return;
    }

}

// Globals related to UI elements
let g_selectedColor = [1.0,1.0,1.0,1.0];
let g_selectedSize = 5;

// set up js actions for html elements
function addActionForHtmlUI(){
    // Button
    document.getElementById('green').onclick = function() { g_selectedColor = [0.0,1.0,0.0,1.0]; }; 
    document.getElementById('red').onclick = function() { g_selectedColor = [1.0,0.0,0.0,1.0]; };
    document.getElementById('clearButton').onclick = function() { g_shapesList = []; renderAllShapes();}; 

    // Buttons that change cursor shape directly
    document.getElementById('pointButton').onclick = function() { g_selectedType = POINT; }; 
    document.getElementById('triButton').onclick = function() { g_selectedType = TRIANGLE; };
    document.getElementById('circleButton').onclick = function() { g_selectedType = CIRCLE; };

    // Sliders
    document.getElementById('redSlide').addEventListener('mouseup', function() { g_selectedColor[0] = this.value/100; });
    document.getElementById('greenSlide').addEventListener('mouseup', function() { g_selectedColor[1] = this.value/100; });
    document.getElementById('blueSlide').addEventListener('mouseup', function() { g_selectedColor[2] = this.value/100; });

    // Slider to change the size
    document.getElementById('sizeSlide').addEventListener('mouseup', function() { g_selectedSize = this.value; });

    document.getElementById('sideSlide').addEventListener('mouseup',
        function() { g_selectedSides = this.value; });

    document.getElementById('drawPicutre').addEventListener('click', drawStarPattern);

    document.getElementById('redSlide').addEventListener('mouseup', updateBrushColor);
    document.getElementById('greenSlide').addEventListener('mouseup', updateBrushColor);
    document.getElementById('blueSlide').addEventListener('mouseup', updateBrushColor);
    document.getElementById('alphaSlide').addEventListener('input', updateBrushColor); // Immediate feedback on alpha change


}

function drawMountainLandscape() {
    // Clear previous shapes
    g_shapesList = [];

    // Define colors for mountains, sun, and water
    const mountainColors = [
        [0.5, 0.5, 0.5, 1.0],  // Dark gray
        [0.6, 0.6, 0.6, 1.0]   // Light gray
    ];
    const sunColor = [1.0, 0.9, 0.0, 1.0];  // Yellow
    const waterColor = [0.0, 0.2, 0.8, 1.0];  // Blue

    // Add mountains
    for (let i = -2; i <= 2; i++) {
        const baseX = i * 0.2; // Base X position for each mountain
        const peakY = 0.1 + Math.abs(i) * 0.1;  // Peak Y position varies
        let triangle1 = new Triangle();
        let triangle2 = new Triangle();
        triangle1.position = [baseX, -0.3, baseX + 0.1, peakY, baseX + 0.2, -0.3];
        triangle2.position = [baseX + 0.1, -0.3, baseX + 0.2, peakY, baseX + 0.3, -0.3];
        triangle1.color = mountainColors[i % 2];
        triangle2.color = mountainColors[(i + 1) % 2];
        g_shapesList.push(triangle1);
        g_shapesList.push(triangle2);
    }

    // Add sun using 8 triangles forming a circle
    for (let i = 0; i < 8; i++) {
        const angle = Math.PI / 4 * i;
        const nextAngle = Math.PI / 4 * (i + 1);
        let triangle = new Triangle();
        triangle.position = [
            0, 0.6,  // Center of the sun
            0.1 * Math.cos(angle), 0.6 + 0.1 * Math.sin(angle),  // Radius of sun
            0.1 * Math.cos(nextAngle), 0.6 + 0.1 * Math.sin(nextAngle)
        ];
        triangle.color = sunColor;
        g_shapesList.push(triangle);
    }

    // Add water
    for (let i = -1; i <= 1; i++) {
        const baseX = i * 0.3;
        let triangle = new Triangle();
        triangle.position = [baseX, -0.8, baseX + 0.3, -0.5, baseX + 0.6, -0.8];
        triangle.color = waterColor;
        g_shapesList.push(triangle);
    }

    // Render all shapes
    renderAllShapes();
}




function main() {
    // set up canvas
    setupWebGL();

    // set up shaders
    connectVariablesToGLSL();

    // actions for html
    addActionForHtmlUI();

    // Register function (event handler) to be called on a mouse press
    canvas.onmousedown = click;
    canvas.onmousemove = function(ev) { if(ev.buttons==1) {click(ev)} }; 

    // Specify the color for clearing <canvas>
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    // Clear <canvas>
    gl.clear(gl.COLOR_BUFFER_BIT);
}



var g_shapesList = [];



function click(ev) {
    let [x, y] = convertCoordEventToWebGL(ev);  // extract the event click and return in in webgl coord

    let point;
    if(g_selectedType == POINT){
        point = new Point();
    } else if((g_selectedType == TRIANGLE)){
        point = new Triangle();
    }
    else {
        point = new Circle();
        point.sides = g_selectedSides;
    }




    point.position=[x,y];
    point.color = g_selectedColor.slice();
    point.size = g_selectedSize;
    g_shapesList.push(point);

    renderAllShapes();

}

function convertCoordEventToWebGL(ev){
    var x = ev.clientX;                                         
    var y = ev.clientY;                                         
    var rect = ev.target.getBoundingClientRect();

    x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
    y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);
    return ([x,y]);
}

function renderAllShapes(){
    var startTime = performance.now();


    // Clear <canvas>
    gl.clear(gl.COLOR_BUFFER_BIT);

    // var len = g_points.length;
    var len = g_shapesList.length;


    for (var i = 0; i < len; i++) {
        g_shapesList[i].render();
    }

    var duration = performance.now() - startTime;
    sendTextToHTML("numdot " + len + 
                   " ms: " + Math.floor(duration) + 
                   " fps: " + Math.floor(10000/duration), 
                   "numdot");

    sendTextToHTML(g_selectedSides, 
    "numside");
}

function sendTextToHTML(text, htmlID){ 
    var htmlElement = document.getElementById(htmlID);
    if(!htmlElement){
        console.log("failed to get " + htmlID + "from HTML");
        return;
    }
    htmlElement.innerHTML = text;
}

function drawStarPattern() {
    const numTriangles = 20; // Total triangles in the star
    const radius = 0.5; // Radius of the circle where the tips of the star reach
    let triangles = [];

    for (let i = 0; i < numTriangles; i++) {
        const angle = 2 * Math.PI * i / numTriangles;
        const nextAngle = 2 * Math.PI * (i + 1) / numTriangles;
        
        // Center of the canvas
        const center = [0, 0];

        // Vertices of the triangle
        const firstVertex = [center[0] + radius * Math.sin(angle), center[1] + radius * Math.cos(angle)];
        const secondVertex = [center[0] + radius * Math.sin(nextAngle), center[1] + radius * Math.cos(nextAngle)];

        // Base of the triangle closer to center
        const baseRadius = radius * 0.5; // Adjust this value to get the desired look
        const thirdVertex = [
            center[0] + baseRadius * Math.sin(angle + Math.PI / numTriangles),
            center[1] + baseRadius * Math.cos(angle + Math.PI / numTriangles)
        ];

        triangles.push({
            vertices: [...firstVertex, ...secondVertex, ...thirdVertex],
            color: [1, 0, 0, 1] // Red color, you can make this dynamic
        });
    }

    triangles.forEach(tri => {
        drawTri(tri.vertices, tri.color);
    });
}

function drawTri(vertices, color) {
    var vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    
    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);

    var u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
    gl.uniform4f(u_FragColor, color[0], color[1], color[2], color[3]);

    gl.drawArrays(gl.TRIANGLES, 0, 3);
}

function updateBrushColor() {
    let red = document.getElementById('redSlide').value / 100;
    let green = document.getElementById('greenSlide').value / 100;
    let blue = document.getElementById('blueSlide').value / 100;
    let alpha = parseFloat(document.getElementById('alphaSlide').value); // Get alpha value from slider

    g_selectedColor = [red, green, blue, alpha]; // Update global color with alpha
}

document.getElementById('redSlide').addEventListener('mouseup', updateBrushColor);
document.getElementById('greenSlide').addEventListener('mouseup', updateBrushColor);
document.getElementById('blueSlide').addEventListener('mouseup', updateBrushColor);
document.getElementById('alphaSlide').addEventListener('input', updateBrushColor); // Immediate feedback on alpha change
