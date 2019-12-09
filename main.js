/*
Author: Jiatao Fan
*/

/*
Assume all words are in an array called "words"
*/
words = ["ACHIEVE", "AFFECT", "ANGER", "ANXIETY", "ARTICLE", "ASSENT", "BODY", "CAUSE", 
"CERTAIN", "COGNITIVE PROCESSES", "COMMUNICATION VERBS", "DEATH", "DISCREPANCIES", "DOWN", "EATING", "EXCLUSIVE", "FAMILY", "FEEL", 
"FILLERS", "FRIENDS", "FUTURE", "GROOM", "HEAR", "HOME", "HUMANS", "I", "INCLUSIVE", "INHIBITION", "INSIGHT", 
"JOB", "LEISURE", "METAPHYSICAL", "MONEY", "MOTION", "MUSIC", "NEGATIONS", "NEGATIVE EMOTION", "NONFLUENCIES", "NUMBER", 
"OCCUPATION", "OPTIMISM", "OTHER", "OTHER REFERENCES", "PAST", "PHYSICAL", "POSITIVE EMOTION", "POSITIVE FEELING", "PREPOSITIONS", "PRESENT", 
"PRONOUN", "RELIGION", "SAD", "SCHOOL", "SEE", "SELF", "SENSES", "SEXUAL", "SIMILARITIES", "SLEEP", "SOCIAL", 
"SPACE", "SPORTS", "SWEAR", "TENTATIVENESS", "TIME", "TV", "UP", "WE", "YOU"];

/*
Data of all states in US
*/


inDefaulMaptView = true;
inCorrelationAndComparisonView = false;
inMostCorrelatedWordClassesView = false;
inLeastCorrelatedWordClassesView = false;
inComparisonView = false;

//For setting color & color levels of map
var colorTheme = "#440e62";
//colorTheme="#9e0b0f";
var COLOR_COUNTS = 50;

//current primary word
var primaryWord = "";

var barColorScale = d3.scale
                      .linear()
                      .domain([0, 10, 20])
                      .range(["#ff0000", "#e6e6e6", "#b8e986"]);

// transform hex color to rgb
function hexToRgb(hex) {
      	var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      	return result ? {
          	r: parseInt(result[1], 16),
          	g: parseInt(result[2], 16),
          	b: parseInt(result[3], 16)
      	} : null;
}

//create color levels from white to the chosen color theme
function Interpolate(start, end, steps, count) {
      	var s = start,
          	e = end,
          	final = s + (((e - s) / steps) * count);
      	return Math.floor(final);
}
function Color(_r, _g, _b) {
      	var r, g, b;
      	var setColors = function(_r, _g, _b) {
          	r = _r;
          	g = _g;
          	b = _b;
      	};
  
      	setColors(_r, _g, _b);
      	this.getColors = function() {
          	var colors = {
              	r: r,
              	g: g,
              	b: b
          	};
          	return colors;
      	};
}

//draw the WORD map into a area(div, table, or...)(WHERE) with specific WIDTH, HEIGHT, and SCALE
function drawMap(word, where, WIDTH, HEIGHT, SCALE){
  
  d3.csv("wordClassesDist.csv", function(err, data) {

    var config = {"color1":"#eeeeee","color2":colorTheme,"stateDataColumn":"STATE","valueDataColumn":word};
  
    //Set up color levels
    var COLOR_FIRST = config.color1, COLOR_LAST = config.color2;
    var rgb = hexToRgb(COLOR_FIRST);
    var COLOR_START = new Color(rgb.r, rgb.g, rgb.b);
    rgb = hexToRgb(COLOR_LAST);
    var COLOR_END = new Color(rgb.r, rgb.g, rgb.b);
    var startColors = COLOR_START.getColors(),
        endColors = COLOR_END.getColors();
    var colors = [];
    for (var i = 0; i < COLOR_COUNTS; i++) {
      var r = Interpolate(startColors.r, endColors.r, COLOR_COUNTS, i);
      var g = Interpolate(startColors.g, endColors.g, COLOR_COUNTS, i);
      var b = Interpolate(startColors.b, endColors.b, COLOR_COUNTS, i);
      colors.push(new Color(r, g, b));
    }

    var quantize = d3.scale.quantize()
        .domain([0, 1.0])
        .range(d3.range(COLOR_COUNTS).map(function(d) { return d }));

    var MAP_STATE = config.stateDataColumn;
    var MAP_VALUE = config.valueDataColumn;
  
    var width = WIDTH,
        height = HEIGHT;
  
    var valueById = d3.map();
    var path = d3.geo.path();

    //Remove old svg and add new one
    d3.select("#mapSVG"+where).remove();
    var svg = d3.select("#"+where).append("svg")
      .attr("class", "map")
      .attr("id","mapSVG"+where)
      .attr("width", width)
      .attr("height", height);


    //get fullname-shortname mapping of states
    d3.tsv("https://s3-us-west-2.amazonaws.com/vida-public/geo/us-state-names.tsv", function(error, names) {
  
    name_id_map = {};
    id_name_map = {};
  
    for (var i = 0; i < names.length; i++) {
      name_id_map[names[i].code] = names[i].id;
      id_name_map[names[i].id] = names[i].code;
    }
  
    data.forEach(function(d) {
      var id = name_id_map[d[MAP_STATE]];
      valueById.set(id, +d[MAP_VALUE]); 
    });
  
    //mapping numbers into [0,1]
    quantize.domain([d3.min(data, function(d){ return +d[MAP_VALUE] }),
      d3.max(data, function(d){ return +d[MAP_VALUE] })]);
    
    //draw states outline and fill color
    d3.json("https://s3-us-west-2.amazonaws.com/vida-public/geo/us.json", function(error, us) {
    svg.append("g")
        .attr("class", "states-choropleth")
        .selectAll("path")
        .data(topojson.feature(us, us.objects.states).features)
        .enter().append("path")
        .attr("transform", "scale(" + SCALE + ")")
        .style("fill", function(d) {
          if (valueById.get(d.id)) {
            var i = quantize(valueById.get(d.id));
            var color = colors[i].getColors();
            return "rgb(" + color.r + "," + color.g +
                "," + color.b + ")";
          } else {
            return "";
          }
        })
        .attr("class", "state")
        .attr("d", path)
        .on("mousemove", function(d) {
            var html = "";
  
            html += "<div class=\"tooltip_kv\">";
            html += "<span class=\"tooltip_key\">";
            html += id_name_map[d.id];
            html += "</span>";
            html += "<span class=\"tooltip_value\">";
            html += (valueById.get(d.id) ? valueById.get(d.id) : "");
            html += "";
            html += "</span>";
            html += "</div>";
            
            $("#tooltip-container").html(html);
            $(this).attr("fill-opacity", "0.4");
            $("#tooltip-container").show();
            
            var coordinates = d3.mouse(this);
            
            var map_width = $('.states-choropleth')[0].getBoundingClientRect().width;
            
            if (d3.event.layerX < map_width / 2) {
              d3.select("#tooltip-container")
                .style("top", (d3.event.layerY + 15) + "px")
                .style("left", (d3.event.layerX + 15) + "px");
            } else {
              var tooltip_width = $("#tooltip-container").width();
              d3.select("#tooltip-container")
                .style("top", (d3.event.layerY + 15) + "px")
                .style("left", (d3.event.layerX - tooltip_width - 30) + "px");
            }
        })
        .on("mouseout", function() {
                $(this).attr("fill-opacity", "1.0");
                $("#tooltip-container").hide();
            });
  
    //draw boarder
    svg.append("path")
        .datum(topojson.mesh(us, us.objects.states, function(a, b) { return a !== b; }))
        .attr("class", "states")
        .attr("transform", "scale(" + SCALE + ")")
        .attr("d", path);

    });
  
    });
  });

}

function getCorrelation(word1, word2){

  var corr;
  d3.csv("correlation.csv", function(err, data){
    var currentRowIndex=0;
    for(var i=0; i<data.length; i++){
      var temp = data[i];
      if(temp["WORD"] == word1){
        currentRowIndex = i;
        var currentRow = data[currentRowIndex];
        corr = +currentRow[word2];
        corr = Math.floor(corr * 100) / 100;
        break;
      }
    }

    document.getElementById("comparisonCorrelationValues").innerHTML = corr;

    document.getElementById("comparisonCorrelationBarValue").style.width = ((corr + 1) / 2 * 100) + "%";
    document.getElementById("comparisonCorrelationBarValue").style.backgroundColor =  barColorScale((corr + 1) * 10);

  var WIDTH = 500;
  var HEIGHT = 318;
  var SCALE = 0.55;
  drawMap(word1, "comparisonMap1", WIDTH, HEIGHT, SCALE);
  drawMap(word2, "comparisonMap2", WIDTH, HEIGHT, SCALE);

  document.getElementById("primaryWord").style.display = "none";

  document.getElementById("frequencyMap").style.display = "none";

  document.getElementById("mostCorrelatedWordClassesMaps").style.display = "none";

  document.getElementById("leastCorrelatedWordClassesMaps").style.display = "none";

  document.getElementById("comparisonView").style.display = "initial";
  });
}

function findMostCorrelatedWords(word){

  //store sorted words & values
  var correlatedWords = words;
  var correlatedValues = [];

  d3.csv("correlation.csv", function(err, data){

    //find word index
    var currentRowIndex=0;
    for(var i=0; i<data.length; i++){
      var temp = data[i];
      if(temp["WORD"] == word){
        currentRowIndex = i;
        break;
      }
    }
    var currentRow = data[currentRowIndex];

    for (var i=0; i < correlatedWords.length; i++){
      correlatedValues[i] = +currentRow[correlatedWords[i]];
    }

    //sorting
      var swapped;
      do {
          swapped = false;
          for (var i=0; i < correlatedWords.length-1; i++) {
              if (correlatedValues[i] < correlatedValues[i+1]) {
                  var temp = correlatedWords[i];
                  correlatedWords[i] = correlatedWords[i+1];
                  correlatedWords[i+1] = temp;
                  var temp2 = correlatedValues[i];
                  correlatedValues[i] = correlatedValues[i+1];
                  correlatedValues[i+1] = temp2;
                  swapped = true;
              }
          }
      } while (swapped);
    

    for (var i=0; i < correlatedWords.length; i++){
      correlatedValues[i] = Math.floor(correlatedValues[i] * 100) / 100;
    }

  //change visibility
  document.getElementById("primaryWord").style.display = "initial";
  document.getElementById("frequencyMap").style.display = "initial";
  document.getElementById("mostCorrelatedWordClassesMaps").style.display = "initial";
  document.getElementById("leastCorrelatedWordClassesMaps").style.display = "none";
  document.getElementById("comparisonView").style.display = "none";

  //update html
  document.getElementById("mostCorrelatedWord1").innerHTML = correlatedWords[1];
  document.getElementById("mostCorrelatedWord2").innerHTML = correlatedWords[2];
  document.getElementById("mostCorrelatedWord3").innerHTML = correlatedWords[3];
  document.getElementById("mostCorrelatedWord1Value").innerHTML = ""+correlatedValues[1];
  document.getElementById("mostCorrelatedWord2Value").innerHTML = ""+correlatedValues[2];
  document.getElementById("mostCorrelatedWord3Value").innerHTML = ""+correlatedValues[3];

  document.getElementById("mostCorrelatedWord1CorrelationBarValue").style.width = ((correlatedValues[1] + 1) / 2 * 100) + "%";
  document.getElementById("mostCorrelatedWord1CorrelationBarValue").style.backgroundColor =  barColorScale((correlatedValues[1] + 1) * 10);

  document.getElementById("mostCorrelatedWord2CorrelationBarValue").style.width = ((correlatedValues[2] + 1) / 2 * 100) + "%";
  document.getElementById("mostCorrelatedWord2CorrelationBarValue").style.backgroundColor =  barColorScale((correlatedValues[2] + 1) * 10);

  document.getElementById("mostCorrelatedWord3CorrelationBarValue").style.width = ((correlatedValues[3] + 1) / 2 * 100) + "%";
  document.getElementById("mostCorrelatedWord3CorrelationBarValue").style.backgroundColor =  barColorScale((correlatedValues[3] + 1) * 10);

  var WIDTH = 350;
  var HEIGHT = 223;
  var SCALE = 0.4;
  drawMap(correlatedWords[1], "mostCorrelatedMap1", WIDTH, HEIGHT, SCALE);
  drawMap(correlatedWords[2], "mostCorrelatedMap2", WIDTH, HEIGHT, SCALE);
  drawMap(correlatedWords[3], "mostCorrelatedMap3", WIDTH, HEIGHT, SCALE);
  });
}

function findLeastCorrelatedWords(word){

  //store sorted words & values in ascending order
  var correlatedWords = words;
  var correlatedValues = [];

  d3.csv("correlation.csv", function(err, data){

    //find word index
    var currentRowIndex=0;
    for(var i=0; i<data.length; i++){
      var temp = data[i];
      if(temp["WORD"] == word){
        currentRowIndex = i;
        break;
      }
    }
    var currentRow = data[currentRowIndex];

    for (var i=0; i < correlatedWords.length; i++){
      correlatedValues[i] = +currentRow[correlatedWords[i]];
    }

    //sorting
      var swapped;
      do {
          swapped = false;
          for (var i=0; i < correlatedWords.length-1; i++) {
              if (correlatedValues[i] > correlatedValues[i+1]) {
                  var temp = correlatedWords[i];
                  correlatedWords[i] = correlatedWords[i+1];
                  correlatedWords[i+1] = temp;
                  var temp2 = correlatedValues[i];
                  correlatedValues[i] = correlatedValues[i+1];
                  correlatedValues[i+1] = temp2;
                  swapped = true;
              }
          }
      } while (swapped);

    for (var i=0; i < correlatedWords.length; i++){
      correlatedValues[i] = Math.floor(correlatedValues[i] * 100) / 100;
    }

  //change visibility
  document.getElementById("primaryWord").style.display = "initial";
  document.getElementById("frequencyMap").style.display = "initial";
  document.getElementById("mostCorrelatedWordClassesMaps").style.display = "none";
  document.getElementById("leastCorrelatedWordClassesMaps").style.display = "initial";
  document.getElementById("comparisonView").style.display = "none";
  //update html
  document.getElementById("leastCorrelatedWord1").innerHTML = correlatedWords[0];
  document.getElementById("leastCorrelatedWord2").innerHTML = correlatedWords[1];
  document.getElementById("leastCorrelatedWord3").innerHTML = correlatedWords[2];
  document.getElementById("leastCorrelatedWord1Value").innerHTML = ""+correlatedValues[0];
  document.getElementById("leastCorrelatedWord2Value").innerHTML = ""+correlatedValues[1];
  document.getElementById("leastCorrelatedWord3Value").innerHTML = ""+correlatedValues[2];

  document.getElementById("leastCorrelatedWord1CorrelationBarValue").style.width = ((correlatedValues[1] + 1) / 2 * 100) + "%";
  document.getElementById("leastCorrelatedWord1CorrelationBarValue").style.backgroundColor =  barColorScale((correlatedValues[1] + 1) * 10);

  document.getElementById("leastCorrelatedWord2CorrelationBarValue").style.width = ((correlatedValues[2] + 1) / 2 * 100) + "%";
  document.getElementById("leastCorrelatedWord2CorrelationBarValue").style.backgroundColor =  barColorScale((correlatedValues[2] + 1) * 10);

  document.getElementById("leastCorrelatedWord3CorrelationBarValue").style.width = ((correlatedValues[3] + 1) / 2 * 100) + "%";
  document.getElementById("leastCorrelatedWord3CorrelationBarValue").style.backgroundColor =  barColorScale((correlatedValues[3] + 1) * 10);

  //draw
  var WIDTH = 350;
  var HEIGHT = 223;
  var SCALE = 0.4;
  drawMap(correlatedWords[0], "leastCorrelatedMap1", WIDTH, HEIGHT, SCALE);
  drawMap(correlatedWords[1], "leastCorrelatedMap2", WIDTH, HEIGHT, SCALE);
  drawMap(correlatedWords[2], "leastCorrelatedMap3", WIDTH, HEIGHT, SCALE);

  });
}

/*
Display the frequency map for a selected word
*/
function selectPrimaryWord(select) {

  //get current primary word
  primaryWord=select.options[select.selectedIndex].value;
  //update html
	document.getElementById("primaryWord").innerHTML = select.options[select.selectedIndex].value;
  

  //set visibility
	document.getElementById("defaultMapView").style.display = "none";
  document.getElementById("correlationAndComparisonView").style.display = "initial";
  document.getElementById("primaryWord").style.display = "initial";
  document.getElementById("frequencyMap").style.display = "initial";
  document.getElementById("mostCorrelatedWordClassesMaps").style.display = "none";
  document.getElementById("leastCorrelatedWordClassesMaps").style.display = "none";
  document.getElementById("comparisonView").style.display = "none";

  var WIDTH = 600;
  var HEIGHT = 382;
  var SCALE = 0.7;
  drawMap(select.options[select.selectedIndex].value, "frequencyMap", WIDTH, HEIGHT, SCALE);
}

/*
Display the most correlated word classes maps
*/
function displayMostCorrelatedWordClassesMaps() {

  findMostCorrelatedWords(primaryWord);
}

/*
Display the least correlated word classes maps
*/
function displayLeastCorrelatedWordClassesMaps() {

  findLeastCorrelatedWords(primaryWord);

}

/*
Display the word to compare
*/
function selectWordToCompare() {

  //get the words for comparison
	var select1 = document.getElementById("wordSelector");
	var select2 = document.getElementById("popupWordSelector");
  var firstWord = select1.options[select1.selectedIndex].value;
  var secondWord = select2.options[select2.selectedIndex].value;

  //update html
	document.getElementById("comparisonWord1").innerHTML = firstWord;
	document.getElementById("comparisonWord2").innerHTML = secondWord;

  //get correlation & draw
  getCorrelation(firstWord, secondWord);

}
