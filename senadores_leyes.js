//
var datos
var provincias

// Simulatiion
var radio1 = 10
var radio2 = 10
var radio3 = 10
var radioHover = 30
var forceStrength = 0.04
var simulation = d3.forceSimulation()

// Svg
var g
var svg
var yAxisSize = 150
var svgSize = {width: 0, height: 0}
var margin = {top: 50, right: 0, bottom: 0, left: 0}

//
var clicked = false
var active = d3.select(null)

// Transition effect
var t = d3.transition()
    .duration(3000)
    .ease(d3.easeElastic)

// Set size on function the window size
var container = document.getElementsByClassName('columns')[0]
var height = 1800
var width = container.offsetWidth

svgSize.width = width - margin.left - margin.right
svgSize.height = height - margin.top - margin.bottom

// X scale
var xRange = []
var amountColumns = 5
for (let i = 1; i < (amountColumns + 1); i++) {
  xRange.push((svgSize.width - yAxisSize)/amountColumns * i + yAxisSize)
}

var xScale = d3.scaleOrdinal()
  .range(xRange.slice(0, 4))
  .domain([0, 3, 1, 2])

// Y scale
var yRange = []
var amountLaws = 9
for (let i = 1; i < (amountLaws + 1); i++) {
  yRange.push(svgSize.height/amountLaws * i)
}

var yScale = d3.scaleOrdinal()
  .range(yRange)
  .domain(['matrimonio igualitario', 'identidad de genero',
           'regimen empreadas domesticas', 'inceminacion arifical',
           'trata personas', 'educacion sexual integral',
           'asignacion universal', 'reforma provicional'])

// Map position and scale
var scale
var centerMap
if (width <= 576) {
  scale = 2.3
  centerMap = [svgSize.width / 2, svgSize.height / 4]
} else if (width <= 768) {
  scale = 2.5
  centerMap = [svgSize.width / 2, svgSize.height / 2.8]
} else if (width <= 992) {
  scale = 2.3
  centerMap = [svgSize.width / 2, svgSize.height / 2.3]
} else {
  scale = 2
  centerMap = [svgSize.width / 2, svgSize.height / 1.8]
}

// Define map projection
var projection = d3.geoEquirectangular()
  .center([-63, -42]) // set centre to further North
  .scale([svgSize.width * scale]) // scale to fit group width
  .translate(centerMap) // ensure centred in group

var geoPath = d3.geoPath()
  .projection(projection)

var zoom = d3.zoom()
  .on('zoom', zoomed)

d3.json('data/provincias.geojson')
  .then(data => {
    provincias = data

    // Bajo un poco el centroide para salta
    provincias.features.forEach(d => {
      if (d.properties.provincia === 'Salta') {
        d.properties.centroid[0] += 1
        d.properties.centroid[1] -= 0.7
      }
    })

    d3.json('data/leyes2.json')
      .then(graph => {
        datos = graph

        datos.forEach(d => {
          d.nombre = d.nombre.replace(/ /g, '_')
        })

        calculateCenetrs()
        appendAll()
        plot()
      })
      .catch(error => {
        console.log(error)
      })
  })


function calculateCenetrs () {
  /*
    Centro y radio para las leyes para ambos plots
  */
  datos.forEach(d => {
    d.centro1 = {
      x: xScale(d.voto),
      y: yScale(d.asunto)
    }
  })

  /* Centro para el mapa */
  datos.forEach(d => {
    if (d.distrito === 'Ciudad Autónoma de Buenos Aires') {
      centroide = projection([-55, -36])
    } else {
      var centroide = provincias.features.filter(dd => {
        return dd.properties.provincia === d.distrito
      })[0]['properties']['centroid']

      centroide = projection(centroide)
    }

    d.centro2 = {
      x: centroide[0],
      y: centroide[1]
    }
  })

  datos.forEach(d => {
    d.radio = radio1
  })

 /* if actuales or no */

 datos.forEach(d => {
  if(d.nombre === "leguizamón_maría_laura" || 
     d.nombre === "terragno_rodolfo" || 
     d.nombre ==="pampuro_josé_juan_bautista" ||
     d.nombre === "fernandez_de_kirchner_cristina" || 
     d.nombre === "colombo_de_acevedo_maría_teresa" || 
     d.nombre === "saadi_ramón_eduardo" || 
     d.nombre === "castillo_oscar_aníbal" || 
     d.nombre === "urquia_roberto_daniel"|| 
     d.nombre === "rossi_carlos_alberto"|| 
     d.nombre === "sanchez_maría_dora" ){
d.actual = "si"
  }else{
d.actual = "no"
  }

  })


 /* radios para los actuales */

 datos.forEach(d => {
  if(d.actual === "si"){
d.radio3 = radio3
  }else{
d.radio3 = 0
  }

  })


  /* radios para el mapa */
  var nombres = []
  datos.forEach(d =>  {
    nombres.push(d.nombre)
  })

  nombres = [ ...new Set(nombres)]

  nombres.forEach(d => {
    var nodosIguales1 = datos.filter(dd => { return d == dd.nombre})

    nodosIguales1.forEach((d, i) => {
      if (i === 0) {
        d.radio2= radio2
      } else {
        d.radio2 = 0
      }
    })
  })
}


function appendAll () {
  // Append the svg
  svg = d3.select('#graph')
    .attr('width', svgSize.width)
    .attr('height', height)

  // Append a main g
  g = svg.append('g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

  // Append the map
  g.append('g')
    .attr('class', 'states')
    .selectAll('path')
    .data(provincias.features)
    .enter()
    .append('path')
    .attr('class', 'map')
    .attr('fill', d => { return fillMap(d) })
    .attr('d', geoPath)

  // Append a g for each node
  node = g.append('g')
    .attr('class', 'nodes')
    .selectAll('.node')
    .data(datos)
    .enter().append('g')
    .attr('class', 'node')

  // To each node append a circle
  node.append('circle')
    .attr('fill', d => { return color(d.bloque) })
    .style('border-radius', '50%')
    .style('stroke', d => { return colorStroke(d.bloque) })

  // To each node append a image
  node.append('image')
    .attr('xlink:href', d => { return 'imgs/' + d.img })
    .attr('id', d => { return d.nombre })

  var xAxis = d3.axisBottom(xScale)
    .tickValues(['A FAVOR', 'EN CONTRA', 'SE ABSTIENE', 'EN AUSCENCIA'])

  var yAxis = d3.axisLeft(yScale)
  /*
    .tickValues(['Matrimonio Igualitario', 'Identidad de Genero',
                 'Regimen Empreadas Domesticas', 'Inceminacion Arifical',
                 'Trata Personas', 'Educacion Sexual Integral',
                 'Asignacion Universal', 'Reforma Provicional'])
  */

  // Append the xAxis
  g.append('g')
    .attr('class', 'axis xAxis')
    .attr('transform', 'translate(0,25)')
    .call(xAxis)

  // Append the yAxis
  g.append('g')
    .attr('class', 'axis yAxis')
    .attr('transform', 'translate(' + yAxisSize + ', 0)')
    .call(yAxis)
    .selectAll('.tick text')
    .call(wrap, yAxisSize)

  // Remove the domain and lines
  g.selectAll('.axis .domain')
    .remove()

  g.selectAll('.axis .tick line')
    .remove()
}


function zoomOverState (d) {
  /*
    On click over the map make a zoom effect
  */
  if (active.node() === this) return zoomReset()
  active.classed('active', false)
  active = d3.select(this).classed('active', true)

  let bounds = geoPath.bounds(d)
  let dx = bounds[1][0] - bounds[0][0]
  let dy = bounds[1][1] - bounds[0][1]
  let x = (bounds[0][0] + bounds[1][0]) / 2
  let y = (bounds[0][1] + bounds[1][1]) / 2
  let scale = Math.max(1, Math.min(7, 0.7 / Math.max(dx / svgSize.width, dy / svgSize.height)))
  let translate = [svgSize.width / 2 - scale * x, svgSize.height / 4.3 - scale * y]

  svg.transition()
    .duration(750)
    .call(zoom.transform, d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale))
}


function zoomReset () {
  /*
  Reset the zoom
  */
  active.classed('active', false)
  active = d3.select(null)

  svg.transition()
    .duration(750)
    .call(zoom.transform, d3.zoomIdentity)
}


function zoomed () {
  /*

  */
  g.style('stroke-width', 1.5 / d3.event.transform.k + 'px')
  g.attr('transform', d3.event.transform)

  node.selectAll('image')
    .on('mouseover', d => {})
    .on('click', d => {})
}


function plot () {
  // Show the axis
  g.selectAll('.axis .tick text')
    .transition()
    .attr('opacity', '1')

  // Hidden the map
  g.selectAll('.map')
    .attr('opacity', '0')
    .on('click', d => { return {} })

  simulation.nodes(datos).alphaTarget(0.8).restart()
    .force('x', d3.forceX().strength(forceStrength).x(d => { return d.centro1.x }))
    .force('y', d3.forceY().strength(forceStrength).y(d => { return d.centro1.y }))
    .force('collide', d3.forceCollide().radius(d => {
      return d.radio === radio1 ? d.radio : d.radio * 1.8
    }))

  // Add a g to for each node
  node = g.selectAll('.node')

  // Append a circle
  node.selectAll('circle')
    .attr('r', radio1)

    


  // Append the photos
  node.selectAll('image')
    .attr('x', d => { return -d.radio })
    .attr('y', d => { return -d.radio })
    .attr('width', d => { return d.radio * 2 })
    .attr('height', d => { return d.radio * 2 })
    .on('mouseover', function (d) { mouseover(d); imageHoverOver(d, this) })
    .on('mouseleave', function (d) { mouseout(d); imageHoverLeave(d, this) })
    .on('click', d => { return imageClick(d) })

  //
  simulation
    .nodes(datos)
    .on('tick', ticked)







}



function plotActuales(){
  simulation.nodes(datos).alphaTarget(1).restart()
    .force('x', d3.forceX().strength(forceStrength).x(d => { return d.centro1.x }))
    .force('y', d3.forceY().strength(forceStrength).y(d => { return d.centro1.y }))
    .force('collide', d3.forceCollide().radius(d => { return d.radio3 }))

  node = g.selectAll('.node')
    .data(datos)

  node.selectAll('circle')
    .attr('r', d => { return d.radio3 })

  // Append the photos
  node.selectAll('image')
    .on('click', d => {})
    .transition()
    .duration(3000)
    .ease(d3.easeElastic)
    .attr('width', d => { return d.radio3 * 2 })
    .attr('height', d => { return d.radio3 * 2 })
    .attr('x', d => { return -d.radio3 })
    .attr('y', d => { return -d.radio3 })

  simulation
    .nodes(datos)
    .on('tick', ticked)

}

function plotMap () {
  // Hidden the axis
  g.selectAll('.axis .tick text')
    .transition()
    .attr('opacity', '0')

  // Show the map
  g.selectAll('.map')
    .on('click', zoomOverState)
    .transition()
    .duration(3000)
    .attr('opacity', '1')


  simulation.nodes(datos).alphaTarget(1).restart()
    .force('x', d3.forceX().strength(forceStrength).x(d => { return d.centro2.x }))
    .force('y', d3.forceY().strength(forceStrength).y(d => { return d.centro2.y }))
    .force('collide', d3.forceCollide().radius(d => { return d.radio2 }))

  node = g.selectAll('.node')
    .data(datos)

  node.selectAll('circle')
    .attr('r', d => { return d.radio2 })

  // Append the photos
  node.selectAll('image')
    .on('click', d => {})
    .transition()
    .duration(1000)
    .ease(d3.easeElastic)
    .attr('width', d => { return d.radio2 * 2 })
    .attr('height', d => { return d.radio2 * 2 })
    .attr('x', d => { return -d.radio2 })
    .attr('y', d => { return -d.radio2 })

  simulation
    .nodes(datos)
    .on('tick', ticked)
}


function ticked () {
  let t = d3.transition()
    .duration(3000)
    .ease(d3.easeElastic)

  node
    .transition(t)
    .attr('transform', d => {
      return 'translate(' + d.x + ',' + d.y + ')'
    })
}


function color (bloque) {
  return bloque == 'Justicialista' ? '#0101DF' :
    bloque == 'Partido de la Victoria' ? '#FC5656' :
    bloque == 'Chubut Somos Todos' ? '#519E19' :
    bloque == 'Coalición Cívica' ? '#2ca02c' :
    bloque == 'Federalismo Santafesino' ? '#DD52D0' :
    bloque == 'Frente Cívico de Córdoba' ? '#519E19' :
    bloque == 'Frente Cívico por Santiago' ? '#4b088a' :
    bloque == 'Frente Cívico y Social de Catamarca' ? '#519E19' :
    bloque == 'Frente de Todos' ? '#519E19' :
    bloque == 'Frente Popular' ? '#519E19' :
    bloque == 'Frente Pro' ? '#e7ba52' :
    bloque == 'Frente Progresista-CC-ARI' ? '#519E19' :
    bloque == 'Fuerza Republicana' ? '#519E19' :
    bloque == 'GEN' ? '#519E19' :
    bloque == 'Justicialista 8 de Octubre' ? '#519E19' :
    bloque == 'Justicialista La Pampa' ? '#519E19' :
    bloque == 'Justicialista para el Dialogo de Los Argentinos' ? '#519E19' :
    bloque == 'Justicialista San Luis' ? '#bf5b17' :
    bloque == 'Justicialista-Frente para la Victoria' ? '#1f77b4' :
    bloque == 'Liberal de Corrientes' ? '#519E19' :
    bloque == 'Misiones' ? '#EDBB99' :
    bloque == 'Movimiento Popular Fueguino' ? '#519E19' :
    bloque == 'Movimiento Popular Neuquino' ? '#519E19' :
    bloque == 'Nuevo Encuentro' ? '#519E19' :
    bloque == 'PARES' ? '#519E19' :
    bloque == 'Partido Nuevo' ? '#519E19' :
    bloque == 'Federalismo y Liberación' ? '#48B9FF' : '#50C1FF';
}


function colorStroke (bloque) {
  return bloque == 'Justicialista' ? '#0101DF' :
    bloque == 'Partido de la Victoria' ? '#FC5656' :
    bloque == 'Chubut Somos Todos' ? '#519E19' :
    bloque == 'Coalición Cívica' ? '#2ca02c' :
    bloque == 'Federalismo Santafesino' ? '#DD52D0' :
    bloque == 'Frente Cívico de Córdoba' ? '#519E19' :
    bloque == 'Frente Cívico por Santiago' ? '#4b088a' :
    bloque == 'Frente Cívico y Social de Catamarca' ? '#519E19' :
    bloque == 'Frente de Todos' ? '#519E19' :
    bloque == 'Frente Popular' ? '#519E19' :
    bloque == 'Frente Pro' ? '#e7ba52' :
    bloque == 'Frente Progresista-CC-ARI' ? '#FC5656' :
    bloque == 'Fuerza Republicana' ? '#519E19' :
    bloque == 'GEN' ? '#519E19' :
    bloque == 'Justicialista 8 de Octubre' ? '#519E19' :
    bloque == 'Justicialista La Pampa' ? '#FC5656' :
    bloque == 'Justicialista para el Dialogo de Los Argentinos' ? '#519E19' :
    bloque == 'Justicialista San Luis' ? '#bf5b17' :
    bloque == 'Justicialista-Frente para la Victoria' ? '#1f77b4' :
    bloque == 'Liberal de Corrientes' ? '#519E19' :
    bloque == 'Misiones' ? '#EDBB99' :
    bloque == 'Movimiento Popular Fueguino' ? '#519E19' :
    bloque == 'Movimiento Popular Neuquino' ? '#519E19' :
    bloque == 'Nuevo Encuentro' ? '#519E19' :
    bloque == 'PARES' ? '#519E19' :
    bloque == 'Partido Nuevo' ? '#519E19' :
    bloque == 'Federalismo y Liberación' ? '#48B9FF' :
    bloque == 'Unión Cívica Radical' ? '#d62728' : '#d62728';
}


function imgNode (nombre) {
  return nombre == 'CAPARROS, Mabel Luisa' ? 'imgs/1.png' :
    nombre == 'DANIELE, Mario Domingo' ? 'imgs/2.png' :
    nombre == 'CAPOS, Liliana Delia' ? 'imgs/3.png' :
    nombre == 'IBARRA, Vilma Lidia' ? '4.png' :
    nombre == 'TERRAGNO, Rodolfo' ? 'imgs/5.png' :
    nombre == 'GONZALEZ DE DUHALDE, Hilda Beatriz' ? 'imgs/6.png' : 'imgs/6.png';
}


function imageHoverOver (d, that) {
  /*
    On hover over node, make this bigger
  */
  if (clicked === false){
    d.radio = radioHover
    simulation.nodes(datos).alphaTarget(0.1).restart()

    // select element in current context
    // d3.select( this )
    d3.select(that)
      .transition(t)
      .attr('x', d => { return -d.radio })
      .attr('y', d => { return -d.radio })
      .attr('width', d => { return d.radio * 3 })
      .attr('height', d => { return d.radio * 3 })
  }
}


function imageHoverLeave (d, that) {
  /*
    On hover leave over node, make this of normal size
  */
  if (clicked === false) {
    d.radio = radio1
    simulation.nodes(datos).alphaTarget(0.1).restart()

    // d3.select( this )
    d3.select(that)
      .transition()
      .attr('x', d => { return -d.radio })
      .attr('y', d => { return -d.radio })
      .attr('width', d => { return d.radio * 2 })
      .attr('height', d => { return d.radio * 2 })
  }
}


function imageClick (d) {
  var nodosIguales = datos.filter(dd => { return d.nombre == dd.nombre})

  if (clicked === false) {
    nodosIguales.forEach(dd => {
      dd.radio = radioHover
    })

    // select element in current context
    d3.selectAll('#' + d.nombre)
      .transition(t)
      .attr('x', d => { return -d.radio })
      .attr('y', d => { return -d.radio })
      .attr('width', d => { return d.radio * 3 })
      .attr('height', d => { return d.radio * 3 })

    // set click as true
    clicked = true
  } else {
    /*
    nodosIguales.forEach(dd => {
      dd.radio = radio1
    })

    d3.selectAll('#' + d.nombre)
      .transition()
      .attr('x', d => { return -d.radio })
      .attr('y', d => { return -d.radio })
      .attr('width', d => { return d.radio * 2 })
      .attr('height', d => { return d.radio * 2 })
    */
    datos.forEach(d => {
      d.radio = radio1
    })

    d3.selectAll('image')
      .transition()
      .attr('x', d => { return -d.radio })
      .attr('y', d => { return -d.radio })
      .attr('width', d => { return d.radio * 2 })
      .attr('height', d => { return d.radio * 2 })

    // set click as false
    clicked = false
  }

  // Restart the simulation to prevent nodes overlaping
  simulation.nodes(datos).alphaTarget(0.1).restart()
}


function fillMap (d) {
  var l = datos.filter(dd => {
    return dd.distrito === d.properties.provincia
  })

  var votosPositivos = l.filter(dd => {
    return dd.voto === 0
  }).length

  return d3.interpolateRdYlGn(votosPositivos / l.length)
}


function wrap (text, width) {
  /*
  Break long label in multiple lines.
  This code was take from https://bl.ocks.org/mbostock/7555321
  Thanks to Mike Bostock!
  */
  text.each(function () {
    let text = d3.select(this)
    let words = text.text().split(/\s+/).reverse()
    let word
    let line = []
    let lineNumber = 0
    let lineHeight = 1.1
    let y = text.attr('y')
    let dy = 0

    let tspan = text.text(null)
      .append('tspan')
      .attr('x', 0)
      .attr('y', y)
      .attr('dy', dy + 'em')

    // eslint-disable-next-line
    while (word = words.pop()) {
      line.push(word)
      tspan.text(line.join(' '))
      if (tspan.node().getComputedTextLength() > width) {
        line.pop()
        tspan.text(line.join(' '))
        line = [word]
        tspan = text.append('tspan')
          .attr('x', 0)
          .attr('y', y)
          .attr('dy', ++lineNumber * lineHeight + dy + 'em')
          .text(word)
      }
    }
  })
}

function mouseover (d) {
 /*
   On mouse over highlight the rect and shoe the tooltip
 */
 // Update the tooltip position and value
 d3.select('#tooltip')
   .style('left', (d3.event.pageX - 150) + 'px')
   .style('top', (d3.event.pageY + 80) + 'px')
   .select('#value')
   .html(() => {
     return '<strong>Nombre:</strong> ' + d.nombre.replace(/_/g, ' ') +
            '<br /><strong>Bloque:</strong> ' + d.bloque +
            '<br /><strong>Distrito:</strong> ' + d.distrito
   })

 // Show the tooltip
 d3.select('#tooltip').classed('hidden', false)
}

function mouseout (d) {
 /*
   On mouse out, remove the highlight
 */
 d3.select('#tooltip').classed('hidden', true)
}



d3.select('#vista-leyes').on('click', d => {
  plot()

})

d3.select('#vista-actuales').on('click', d => {
  plotActuales()

})

d3.select('#vista-mapa').on('click', d => {
  plotMap()

})
