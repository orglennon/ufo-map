import * as d3 from 'd3';
import * as topojson from 'topojson';
import { DateTime } from 'luxon';
import { STATE } from './app_state.js';
import { highlightLocations } from './map_canvas.js'



let width, height;
let data, timelineData;
let svg;
let bars, xScale, yScale;

export function initTimeline(_d, _t) {
  // setup data
  data = _d
  timelineData = _t;

  // console.log(timelineData)

  // setup dom
  svg = d3.select("#timeline-wrapper").insert('svg', ':first-child')


  bars = svg.append("g")
        .attr("id", "timeline-bars")


  bars.selectAll("rect")
        .data(timelineData.bins)
        .enter()
        .append("rect")
        .attr("class", "timeline-bar")
        // .attr("fill", "rgb(18, 38, 38)")
        .on("mouseenter", (e, d) => {
          d3.selectAll(".timeline-bar").classed("hovered", false)
          let x = xScale(d.x0) + Math.max(0, xScale(d.x1) - xScale(d.x0)) + 5
          let y = yScale(d.length) - 50

          d3.select(e.target).classed("hovered", true)

          let formatDate = d3.utcFormat("%Y")

          d3.select("#timeline-tooltip")
            .classed("hidden", false)
            .style("left", x-50 + "px")
            .html(`${formatDate(d.x0)}: ${d.length}`)


          highlightLocations(d)
        })
        .on("mouseleave", (e, d) => {
          d3.selectAll(".timeline-bar").classed("hovered", false)
          d3.select("#timeline-tooltip")
            .classed("hidden", true)

          highlightLocations(null)
        })

  svg.append('g')
  .attr("id", "x-axis")
  

  sizeTimeline()
}

export function sizeTimeline(){
  let timelineWrapperEl = document.getElementById("timeline-wrapper")
  // console.log(timelineWrapperEl.getBoundingClientRect())
  let padding = {top:10, right:10, bottom:30, left:10}
  width = timelineWrapperEl.getBoundingClientRect().width
  height = timelineWrapperEl.getBoundingClientRect().height

  svg.attr("viewBox", [0, 0, width, height]);

  xScale = d3.scaleTime()
            .domain(timelineData.dateRange)
            .range([padding.left, width-padding.right])

  yScale = d3.scaleLinear()
            .domain([0, d3.max(timelineData.bins, d => d.length)]).nice()
            .range([height-padding.bottom, padding.top])

  let barWidth = (width-(padding.left+padding.right)) / timelineData.bins.length - 1;
  console.log(width, padding, timelineData)

  // Math.max(0, xScale(d.x1) - xScale(d.x0) - 1)

  bars.selectAll("rect")
      .data(timelineData.bins)
        // .join("rect")
        // .attr("width", "10px")
        // .attr("height", "10px")
        .attr("x", d => xScale(d.x0) + 1)
        .attr("width", barWidth )
        .attr("y", d => yScale(d.length))
        .attr("height", d => yScale(0) - yScale(d.length))

        console.log(timelineData)

  // ticks for all bins
  // d3.select("#x-axis")
  //   .attr("transform", "translate(0," + (height-padding.bottom) + ")")
  //   .call(
  //     d3.axisBottom(xScale)
  //       .tickFormat(d3.timeFormat("%Y-%m-%d"))
  //       .tickValues(timelineData.bins.map(function(d) { return d.x0 }))
  //   )

  let xAxis = d3.select("#x-axis")
    .attr("transform", "translate(0," + (height-padding.bottom) + ")")
    .call(
      d3.axisBottom(xScale)
        .tickFormat(d3.timeFormat("%Y"))
    )

  xAxis.selectAll(".tick")
        .style("margin-left", barWidth/2)
}


export function highlightTimeline(location){
  // console.log(location)

  if(location == null){
    bars.selectAll(".timeline-bar")
        .classed("hovered", false)
  } else {
    bars.selectAll(".timeline-bar")
            .classed("hovered", (d) => {

              // this is the hacky way to do this
              // i know the buckets are years, so im only checking the year
              // but i should really be checking if the date is between the dates for the bin
              // and i probably don't need luxon at all in this project so far

              let locationYear = location.converted_date.year
              let formatDate = d3.utcFormat("%Y")
              let binYear = formatDate(d.x0)
              if(locationYear == binYear){
                return true
              } else {
                return false
              }
            })
  }
}
