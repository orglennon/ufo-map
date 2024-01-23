import './style.css'
import { DateTime } from 'luxon'
import { STATE } from './app_state.js'
import { initMap, sizeMap } from './map.js'
import { initTimeline, sizeTimeline } from './timeline.js'
// import { csv, json, text } from 'd3';
import * as d3 from 'd3';

Promise.all([
  // d3.csv("/complete.csv"),
  d3.csv("/first-2000.csv"),
  d3.json("https://cdn.jsdelivr.net/npm/world-atlas@1/world/110m.json") // World map
  // d3.json("https://unpkg.com/us-atlas@3/counties-10m.json") // US Map
])
.then(([ufoData, geoData]) => {
  console.log(ufoData, geoData)


  // "geometry": {
  //     "type": "Point",
  //     "coordinates": [
  //         39.32373809814453,
  //         -111.67823791503906
  //     ]
  // }

  ufoData.forEach((d,i) => {
    d.converted_date = DateTime.fromFormat(d.datetime, "L/d/yyyy HH:mm")
    d.id = i
    d.geometry = {
      "type": "Point",
      "coordinates": [d.longitude, d.latitude]
    }
  })

  let timelineData = {
    dateRange: d3.extent(ufoData, function (d) { return d.converted_date; }),
    bins: []
  }

  // timelineData.months = d3.timeMonths(d3.timeDay.offset(timelineData.dateRange[0],-1),
  //                       d3.timeDay.offset(timelineData.dateRange[1], 1))

  // timelineData.thresholds = d3.timeMonth.every(6).range(...timelineData.dateRange)

  timelineData.thresholds = d3.timeYear.every(1).range(...timelineData.dateRange)

  // this is slow, is there a better way to do this?
  // timelineData.monthBins.forEach((month, m) => {
  //   let bin = {"date": month, "records": []}
  //   let dateFrom = m == 0 ? null : timelineData.monthBins[m-1]
  //   let dateTo = month
  //   ufoData.forEach(d => {
  //     if(d.converted_date >= dateFrom && d.converted_date < dateTo){
  //       bin.records.push(d.id)
  //     }
  //   })

  //   timelineData.timelineBins.push(bin)

  // })

  timelineData.bins = d3.histogram()
                  .domain(timelineData.dateRange)
                  .thresholds(timelineData.thresholds)
                  .value(d => d.converted_date)
                  (ufoData)

  // console.log(timelineData)

  initMap(ufoData, geoData)
  initTimeline(ufoData, timelineData)

  window.onresize = resize;
})

function resize(){
  setState()
  sizeMap()
  sizeTimeline()
}

if(window.innerWidth < 640){
  STATE.MOBILE = true
} else {
  STATE.MOBILE = false
}

function setState(){
  // console.log("set state")
  // console.log(window.innerWidth, "window width")

  if(window.innerWidth < 640){
    STATE.MOBILE = true
  } else {
    STATE.MOBILE = false
  }

  // console.log(STATE)
}