import * as d3 from 'd3';
import * as topojson from 'topojson';
import { STATE } from './app_state.js';
import { highlightTimeline } from './timeline.js';  
   


let width, height;
let data;
let projection, geojson, geoData;
let rotate = [60,-30];
let scale = 1
let svg, path, graticule, graticules, countries, locations;


export function initMap(_d, g) {
  geoData = g;
  data = _d;
  geojson = topojson.feature(geoData, geoData.objects.countries).features;
  

  // setup html/svg
  svg = d3.select("#map-wrapper").insert('svg', ':first-child')

  graticule = d3.geoGraticule()

  svg.append("path")
        .datum(graticule.outline)
        .attr('id', 'graticle-outline')
        .attr("fill", "#122626")


  svg.append("circle")
    .attr("id", "globe")
    .attr("fill", "#122626")

  projection = d3.geoOrthographic()

  svg.call(d3.drag().on('drag', (e) => {
    // return
    if(STATE.MOBILE){
      console.log(e)
      const r = projection.rotate()
      const sensitivity = 75
      const k = sensitivity / projection.scale()
      rotate = [
        r[0] + e.dx * k,
        r[1] - e.dy * k
      ]

      sizeMap()
    } else {
      console.log("not mobile")
    }
  }))

  
  graticules = svg.append("g").attr('id', 'graticles')

  graticules.append("path").datum(graticule)
      .attr("class", "graticule")
      .attr("fill", "none")
      .attr("stroke", "rgba(255,255,255,0.1)");


  countries = svg.append("g").attr('id', "countries")

  countries.selectAll("path")
      .data(geojson)
      .enter()
      .append("path")
      .style('fill', '#8f461d')
      .style('stroke', '#bb693c')

    
  

  locations = svg.append("g").attr('id', "locations")

  locations.selectAll("circle")
    .data(data)
    .enter()
    .append("circle")
    .attr("class", "ufo-dot")
    .attr("r", 1)
    .on("mouseenter", (e, d) => {
      // console.log(e, d)
      d3.selectAll(".ufo-dot").classed("hovered", false)
      let coords = projection([d.longitude, d.latitude])
      let cx = coords[0]
      let cy = coords[1]
      d3.select(e.target).classed("hovered", true)
      d3.select("#map-tooltip")
        .classed("hidden", false)
        .style("left", cx+5 + "px")
        .style("top", cy + "px")
        .html(`Shape: ${d.shape}`)

        highlightTimeline(d)

    })
    .on("mouseleave", (e, d) => {
      d3.selectAll(".ufo-dot").classed("hovered", false)
      d3.select("#map-tooltip")
        .classed("hidden", true)

      highlightTimeline(null)
    })

    sizeMap()
}

export function sizeMap(){
  let mapWrapperEl = document.getElementById("map-wrapper")
  let padding = 20;
  width = mapWrapperEl.getBoundingClientRect().width - padding*2
  height = mapWrapperEl.getBoundingClientRect().height - padding*2

  var conus = topojson.feature(geoData, {
    type: "GeometryCollection",
    geometries: geoData.objects.countries.geometries
  });


  if(STATE.MOBILE){
    projection = d3.geoOrthographic()
        // .scale(scale)
        .center([0, 0])
        .rotate([rotate[0], rotate[1]])
        .translate([width / 2, height / 2])
        // console.log(rotate[0], rotate[1], "rotate")
  } else {
    projection = d3.geoNaturalEarth1()
    projection.fitExtent([[padding, padding],[width, height]], conus)
  }
  
  
  

  svg = d3.select("#map-wrapper").select('svg')
                .attr("width",width)
                .attr("height",height);


  path = d3.geoPath()
    .projection(projection);


  graticule = d3.geoGraticule()


  if(STATE.MOBILE){
    svg.select("#globe")
        .attr("cx", width/2)
        .attr("cy", height/2)
        .attr("r", (width)/2-padding*2)
        .classed("hidden", false)

    svg.select("#graticle-outline")
        .classed("hidden", true)

  } else {
    svg.select("#graticle-outline")
        .datum(graticule.outline)
        .attr("d", path)
        .classed("hidden", false)

    svg.select("#globe")
        .classed("hidden", true)
  }
  

  

  
  graticules = svg.select("#graticles")

  graticules.select("path").datum(graticule)
      .attr("class", "graticule")
      .attr("d", path)

  countries = svg.select("#countries")

  countries.selectAll("path")
      .data(geojson)
      .attr("d", path)

  locations = svg.select("#locations")

  locations.selectAll(".ufo-dot")
    .data(data)
    .attr("cx", d => {
      let coords = projection([d.longitude, d.latitude]);
      if(coords != null){
        return projection([d.longitude, d.latitude])[0];
      }
    })
    .attr("cy",d => {
      let coords = projection([d.longitude, d.latitude]);
      if(coords != null){
        return projection([d.longitude, d.latitude])[1];
      }
    })
    .attr("visibility", getVisibility)


  // geopathLocations = svg.select("#geopathLocations")

  // geopathLocations.selectAll("path")
  //                 .data(data)
  //                 .attr("d", path)
  //                 .attr("class", "geopath-location")
}

export function highlightLocations(locals){
  // console.log(locals)

  if(locals == null){
    locations.selectAll(".ufo-dot")
            .classed("hovered", false)
  } else {
    locations.selectAll(".ufo-dot")
            .classed("hovered", (d) => {
              // console.log(d)
              // console.log(locals.indexOf(d))
              if(locals.indexOf(d) >= 0){
                return true
              } else {
                return false
              }
            })
  }
}


function getVisibility(d) {
  const visible = path(
    {type: 'Point', coordinates: [d.longitude, d.latitude]});

  return visible ? 'visible' : 'hidden';
}