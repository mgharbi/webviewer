// Helpers -----------------
function getText(id) {
  return document.getElementById(id).textContent;
}
// -------------------------

function HDRViewer(parent, config, width=1024, height=512) {
  var self = this;

  var box = document.createElement('div');
  box.className = "hdrviewer";

  parent.style.maxWidth = width + "px";

  var help = document.createElement('div');
  help.appendChild(document.createTextNode(
    "Use mouse wheel to zoom in/out. " +
    "Click and drag to pan. " +
    "Hold SHIFT+click and drag to change exposure. " +
    "Press keys [1], [2], ... to switch between individual images. " +
    "Use the LEFT/RIGHT arrows to navigate between image sets. " +
    "Double click to reset the viewer."
  ));
  help.className = "help";
  box.appendChild(help);

  this.exposure_range = [-8.0, 4.0];

  // Build navigator
  this.tree = [];
  this.selection = [];
  this.textures = [];
  this.buildTreeNode(config, 0, this.tree, box);
  for (var i = 0; i < this.selection.length; ++i) {
      this.selection[i] = 0;
  }
  
  // Renderer globals
  this.canvas = document.createElement('canvas');
  this.canvas.id = "hdr_viewer";
  this.renderer = new THREE.WebGLRenderer({canvas: this.canvas});
  this.scene = new THREE.Scene();
  this.camera = new THREE.OrthographicCamera(
    -width/2, width/2, height/2, -height/2, 1, 1000);
  this.renderer.setSize( width, height );

  // Materials
  this.material = new THREE.ShaderMaterial({
    uniforms: {
      tDiffuse: { value: this.textures[0] },
      exposure: { value: 0.0 },
    },
    vertexShader: getText("hdr_vertex_shader"),
    fragmentShader: getText("hdr_frag_shader"),
    side: THREE.DoubleSide
  });

  // Geometry
  var plane = new THREE.PlaneBufferGeometry(width, height);
  this.quad = new THREE.Mesh(plane, this.material);
  this.quad.position.z = -1
  this.quad.scale.x = -1;
  this.quad.rotation.z = Math.PI;
  this.scene.add(this.quad);

  box.appendChild(this.renderer.domElement);
  parent.appendChild(box);

  this.info = document.createElement('div');
  this.info.className = "info";
  this.change_exposure(0);
  parent.appendChild(this.info);

  var reset_button = document.createElement('button');
  reset_button.id = "reset";
  reset_button.innerHTML = "Reset";
  parent.appendChild(reset_button);

  // UI events
  d3.select(reset_button)
    .on("click", function() {self.reset_zoom();});
  d3.select(this.canvas)
    .call(d3.drag().on("drag", function() { self.drag(); }))
    .call(d3.zoom().scaleExtent([1, 8])
      .on("zoom", function () { self.zoom(); }))
      .on("dblclick.zoom", function () { self.reset_zoom(); })
    ;
  d3.select(document)
    .on("keydown", function(event) { self.keyPressHandler(event); });

  // Start rendering
  this.showContent(0, 0);
  this.animate();
}

HDRViewer.prototype.zoom = function() {
  var transform = d3.event.transform;
  this.quad.scale.x = -transform.k;
  this.quad.scale.y = transform.k;
  this.quad.scale.z = transform.k;
  this.quad.needsUpdate = true;
}

HDRViewer.prototype.reset_zoom = function() {
  var transform = d3.event.transform;
  this.quad.position.x = 0;
  this.quad.position.y = 0;
  this.quad.scale.x = -1;
  this.quad.scale.y = 1;
  this.quad.scale.z = 1;
  this.quad.needsUpdate = true;
  this.change_exposure(0);
}

HDRViewer.prototype.change_exposure = function(e) {
  this.material.uniforms.exposure.value = e;
  this.material.uniforms.exposure.needsUpdate = true;
  this.info.innerHTML = "Exposure " + e.toFixed(2) + " EV";
}

HDRViewer.prototype.drag = function() {
  var isShift = d3.event.sourceEvent.shiftKey;
  if( isShift ) {
    var exposure = this.material.uniforms.exposure.value;
    exposure += -d3.event.dy*0.1;
    exposure = Math.min(
      Math.max(exposure, this.exposure_range[0]), this.exposure_range[1]);
    this.change_exposure(exposure);
  } else {
    this.quad.position.x += d3.event.dx;
    this.quad.position.y -= d3.event.dy;
    this.quad.needsUpdate = true;
  }
}

HDRViewer.prototype.animate = function() {
  self = this
  requestAnimationFrame(function() {return self.animate();});

  this.render();
}

HDRViewer.prototype.render = function() {
  this.renderer.render( this.scene, this.camera );
}

HDRViewer.prototype.keyPressHandler = function(event) {
  if (d3.event.key === "ArrowRight") {
    this.showContent(0, this.selection[0]+1);
  } else if (d3.event.key === "ArrowLeft") {
    this.showContent(0, this.selection[0]-1);
  } else if (d3.event.code.includes("Digit")) {
    var idx = parseInt(d3.event.key)
    if(idx === 0) {
      idx = 9;
    } else {
      idx--;
    }
    this.showContent(this.selection.length-1, idx);
  } 
}

HDRViewer.prototype.showContent = function(level, idx) {
  // Hide
  var bgWidth = 0;
  var bgHeight = 0;
  var bgPosX = 0;
  var bgPosY = 0;
  var bgOffsetX = 0;
  var bgOffsetY = 0;
  var l = 0;
  var node = {};
  node.children = this.tree;
  while (node.children.length > 0 && node.children.length > this.selection[l]) {
    node = node.children[this.selection[l]];
    node.selector.className = 'selector selector-primary';
    node.content.style.display = 'none';
    if (l == this.selection.length-1) {
      bgWidth =   node.content.bgWidth;
      bgHeight =  node.content.bgHeight;
      bgPosX =    node.content.bgPosX;
      bgPosY =    node.content.bgPosY;
      bgOffsetX =  node.content.bgOffsetX;
      bgOffsetY =  node.content.bgOffsetY;
    }
    l += 1;
  }
  this.selection[level] = Math.max(0, idx);
  
  // Show
  l = 0;
  node = {};
  node.children = this.tree;
  while (node.children.length > 0) {
    if (this.selection[l] >= node.children.length)
      this.selection[l] = node.children.length - 1;
    node = node.children[this.selection[l]];
    node.selector.className = 'selector selector-primary active';
    node.content.style.display = 'block';
    if (l == this.selection.length-1) {
      node.content.bgWidth = bgWidth;
      node.content.bgHeight = bgHeight;
      node.content.bgPosX = bgPosX;
      node.content.bgPosY = bgPosY;
      node.content.bgOffsetX = bgOffsetX;
      node.content.bgOffsetY = bgOffsetY;
      node.content.style.backgroundSize = bgWidth+'px '+bgHeight+'px';
      node.content.style.backgroundPosition = (bgOffsetX + bgPosX)+'px '+ (bgOffsetY + bgPosY)+'px';
    }
    l += 1;
  }

  this.material.uniforms.tDiffuse.value = node.texture;
  this.material.uniforms.tDiffuse.needsUpdate = true;
}

HDRViewer.prototype.buildTreeNode = function(config, level, nodeList, parent) {
  var self = this;

  var selectorGroup = document.createElement('div'); 
  selectorGroup.className = "selector-group";

  parent.appendChild(selectorGroup);

  var insets = [];

  for (var i = 0; i < config.length; i++) {
    // Create tab
    var selector = document.createElement('div');
    selector.className = "selector selector-primary";

    selector.addEventListener("click", function(l, idx, event) {
      this.showContent(l, idx);
    }.bind(this, level, i));

    // Add to tabs
    selectorGroup.appendChild(selector);

    // Create content
    var contentNode = {};
    contentNode.children = [];
    contentNode.selector = selector;
    contentNode.texture = null;

    var content;
    if (typeof(config[i].elements) !== 'undefined') {
      // Recurse
      content = document.createElement('div');
      this.buildTreeNode(
        config[i].elements, level+1, contentNode.children, content);
      selector.appendChild(document.createTextNode(config[i].title));
    } else {
      // Create image
      content = document.createElement('div'); 
      var texture = new THREE.RGBELoader().load(
        config[i].image, function(texture, textureData) {
        texture.minFilter = THREE.NearestFilter;
        texture.magFilter = THREE.NearestFilter;
      });
      contentNode.texture = texture;
      var key = '';
      if (i < 9)
        key = i+1 + ": ";
      else if (i == 9)
        key = "0: ";
      else if (i == 10)
        key = "R: ";

      selector.appendChild(document.createTextNode(key+config[i].title));
      this.selection.length = Math.max(this.selection.length, level+1);
    }
    content.style.display = 'none';
    parent.appendChild(content);
    contentNode.content = content;
    nodeList.push(contentNode);
  }
}
