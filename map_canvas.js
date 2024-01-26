import * as d3 from 'd3';
import * as topojson from 'topojson';
import { STATE } from './app_state.js';
import { highlightTimeline } from './timeline.js';  
   


let width, height, padding;
let data;
let projection, countryFeatures, geoData;
let sphereScale = 540
let rotate = [60,-30];
let scale = 1
let hovered = null;
let highlighted = [];

let context, canvas;
let path, visibilityPath, graticule, graticules, countries, locations, outline;


export function initMap(_d, g) {
  geoData = g;
  data = _d;
  countryFeatures = topojson.feature(geoData, geoData.objects.countries);
  outline = ({type: "Sphere"})

  // setup html/canvas
  canvas = d3.select("#map-wrapper").insert('canvas', ':first-child')
  canvas.on("mousemove", e => {
    // console.log(e)
    let rect = document.getElementById("map-canvas").getBoundingClientRect()
    let mouseX = e.clientX * window.devicePixelRatio - rect.left
    let mouseY = e.clientY * window.devicePixelRatio - rect.top

    // let mouseX = e.clientX  - rect.left
    // let mouseY = e.clientY  - rect.top

    // console.log(mouseX, mouseY)

    

    hovered = null
    d3.select("#map-tooltip")
        .classed("hidden", true)
    let hoveredCoords;
    data.forEach((d) => {
      let coords = projection([d.longitude, d.latitude])
      if(coords != null){
        if(getVisibility(d)){
          
          if(mouseX <= coords[0] + 5 && mouseX >= coords[0] && mouseY >= coords[1] && mouseY <= coords[1] + 5){
            
            hovered = d
            hoveredCoords = coords;
            return
          }
        }
      }
    })


    if(hovered != null){
      d3.select("#map-tooltip")
        .classed("hidden", false)
        .style("left", hoveredCoords[0]/ window.devicePixelRatio + 5 + "px")
        .style("top", hoveredCoords[1] / window.devicePixelRatio + "px")
        .html(`Shape: ${hovered.shape}`)

        highlightTimeline(hovered)
    } else {
      d3.select("#map-tooltip")
        .classed("hidden", true)
    }

    renderMap()
  })
  .on("mouseleave", e => {
    hovered = null
    d3.select("#map-tooltip")
      .classed("hidden", true)
  })
  canvas.attr("id", "map-canvas")
  context = canvas.node().getContext("2d")

  graticule = d3.geoGraticule10()

  projection = d3.geoOrthographic()

  canvas.call(d3.drag().on('drag', (e) => {
    // return
    if(STATE.MOBILE){
      const r = projection.rotate()
      const sensitivity = 75
      const k = sensitivity / projection.scale()
      // console.log(e, k)
      rotate = [
        r[0] + e.dx * k,
        r[1] - e.dy * k
      ]

      sizeMap()
      renderMap()
    } else {
      console.log("not mobile")
    }
  }))
    

  // locations = svg.append("g").attr('id', "locations")

  // locations.selectAll("circle")
  //   .data(data)
  //   .enter()
  //   .append("circle")
  //   .attr("class", "ufo-dot")
  //   .attr("r", 1)
  //   .on("mouseenter", (e, d) => {
  //     // console.log(e, d)
  //     d3.selectAll(".ufo-dot").classed("hovered", false)
  //     let coords = projection([d.longitude, d.latitude])
  //     let cx = coords[0]
  //     let cy = coords[1]
  //     d3.select(e.target).classed("hovered", true)
  //     d3.select("#map-tooltip")
  //       .classed("hidden", false)
  //       .style("left", cx+5 + "px")
  //       .style("top", cy + "px")
  //       .html(`Shape: ${d.shape}`)

  //       highlightTimeline(d)

  //   })
  //   .on("mouseleave", (e, d) => {
  //     d3.selectAll(".ufo-dot").classed("hovered", false)
  //     d3.select("#map-tooltip")
  //       .classed("hidden", true)

  //     highlightTimeline(null)
  //   })

    sizeMap()
    renderMap()
}

export function sizeMap(){
  let mapWrapperEl = document.getElementById("map-wrapper")
  padding = 20;
  width = mapWrapperEl.getBoundingClientRect().width*window.devicePixelRatio
  height = mapWrapperEl.getBoundingClientRect().height*window.devicePixelRatio
  // width = mapWrapperEl.getBoundingClientRect().width
  // height = mapWrapperEl.getBoundingClientRect().height

  canvas.attr("width", width + "px")
  canvas.attr("height", height + "px")
  canvas.style("width", width/window.devicePixelRatio + "px");
  canvas.style("height", height/window.devicePixelRatio + "px")
  // canvas.style("width", width + "px");
  // canvas.style("height", height + "px")

  var conus = topojson.feature(geoData, {
    type: "GeometryCollection",
    geometries: geoData.objects.countries.geometries
  });


  if(STATE.MOBILE){
    projection = d3.geoOrthographic()
        .scale(sphereScale)
        .center([0, 0])
        .rotate([rotate[0], rotate[1]])
        .translate([width / 2, height / 2])
        // console.log(rotate[0], rotate[1], "rotate")
  } else {
    projection = d3.geoNaturalEarth1()
    projection.fitExtent([[padding, padding],[width, height]], conus)
  }
  
  
  visibilityPath = d3.geoPath()
    .projection(projection);
  path = d3.geoPath(projection, context)

}

export function renderMap(){
  context.clearRect(0, 0, width, height);

  // console.log(countryFeatures, path(countryFeatures))
  context.beginPath()
  // if(STATE.MOBILE){
  //   context.fillStyle = "#122626"
  //   context.arc(width/2, height/2, width/2-padding, 0, 2 * Math.PI);
  //   context.fill();
  // }

  context.beginPath(), path(outline), context.clip(), context.fillStyle = "#122626", context.fillRect(0, 0, width, height);
  context.beginPath(), path(graticule), context.strokeStyle = "rgba(255,255,255,0.1)", context.stroke();
  context.beginPath(), path(countryFeatures), context.fillStyle = "#8f461d", context.strokeStyle = "#bb693c", context.fill(), context.stroke();

  

  data.forEach((d) => {
    let coords = projection([d.longitude, d.latitude])
    if(coords != null){
      if(getVisibility(d)){
        if(hovered == d || highlighted.indexOf(d) >= 0){
          context.fillStyle = "#ffffff"
          context.fillRect(coords[0], coords[1], 3, 3)
        } else {
          context.fillStyle = "#f59342"
          context.fillRect(coords[0], coords[1], 1, 1)
        }
      }
    }
  })

}

export function highlightLocations(locals){
  // console.log(locals)
  // highlighted = []
  
  if(locals != null){
    highlighted = locals
  //   data.forEach(d => {
  //     if(locals.indexOf(d) >= 0){
  //       highlighted.push
  //     }
  //   })
  } else {
    highlighted = []
  }
  renderMap()
}


function getVisibility(d) {
  // console.log(path)
  const visible = visibilityPath(
    {type: 'Point', coordinates: [d.longitude, d.latitude]});

  return visible ? true : false;
}