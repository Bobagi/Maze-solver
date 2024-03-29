let mapPixel = []
let mapStr = "**#*********--*************----*-----*--*-----*----**----*-----*--*-----*----**----*-----*--*-----*----***************************-----*--*--------*--*----*-----*--*--------*--*----*******--****--****--******-----*-----*--*-----*----------*-----*--*-----*----------*--**********--*----------*--*--------*--*----------*--*--------*--*-----*********--------*********-----*--*--------*--*----------*--*--------*--*----------*--**********--*----------*--*--------*--*----------*--*--------*--*-----************--*************----*-----*--*-----*----**----*-----*--*-----*----****--****************--***--*--*--*--------*--*--*----*--*--*--------*--*--*--******--****--****--*******----------*--*----------**----------*--*----------***********************$***"
let startPos = []
let endPos = []
let mapWidth = 26
let mapHeight = 29
var startTime
var endTime
// black = 0, white = 1, blue = 2, red = 3, yellow = 4, green = 5
const mapPalette = [{"r": 0,"g": 0,	"b": 0}, {	"r": 255,	"g": 255,	"b": 255}, {	"r": 0,	"g": 0,	"b": 205}, {	"r": 205,	"g": 0,	"b": 0}, {	"r": 235,	"g": 235,	"b": 0}, {	"r": 0,	"g": 255,	"b": 0}]
let debug = false

function setFields(){
	document.getElementById("numberCol").value = mapWidth;
	document.getElementById("numberRow").value = mapHeight;
	document.getElementById("map").value = mapStr;
}

function start() {
	startPos = []
 	endPos = []
	mapDataStructure()
	renderMap()	
	// setInterval(firePropagation,50)
}

function renderBestPath(path){
	endTime = new Date().getTime();
	var totalExecTime = endTime - startTime;
	document.getElementById("lblExecTime").innerText = "Execution time: "+totalExecTime+"/ms"	
	for(var i = 1;i<path.length-1;i++){	
		var stringPos = path[i][1] + (path[i][0] * mapWidth);
		replaceAt(stringPos, "@");
	}	
	start()
}


function hc_def_heuristic_val (height, width) {
	var maxHeuristicVal = endPos[0][0]+endPos[0][1];
	// Se a posição não for uma celula caminhável
	if (mapStr[height * mapWidth + width] == "-")
		return maxHeuristicVal;
	else 
		return Math.abs(endPos[0][0] - height) + Math.abs(endPos[0][1] - width);
}

function hc_evaluate_neighboorhood (height, width, coming_from) {
	// Quanto maior valor Heuristico mais distante a celula esta do ponto final
	var maxHeuristicVal = endPos[0][0]+endPos[0][1];
	// Cria vetor para guardar o valor Heuristico das celulas vizinhas
	var directions = {right: maxHeuristicVal, left: maxHeuristicVal, top: maxHeuristicVal, bot: maxHeuristicVal};
	// Vetores com modificadores que permitem buscar as celulas vizinhas
	var direct_mod_h = {right: 0, left: 0, top: -1, bot: 1};
	var direct_mod_w = {right: 1, left: -1, top: 0, bot: 0};
	// Nomes das direções
	var directions_names = ["right","left","top","bot"];
	directions_names.forEach(
		function(direction){
			//console.log(direction);
			if ((coming_from != direction) && (height+direct_mod_h[direction] >= 0) && (width+direct_mod_w[direction] >= 0)) {
				//console.log(directions[direction]);
				directions[direction] = 
					hc_def_heuristic_val( height+direct_mod_h[direction], width+direct_mod_w[direction] );
			}
	  	}
	);

	// Guarda movimentos cujo valor heuristico seja igual e menor que todos os demais.
	var empate = [];
	// Define o valor auxiliar com o valor heuristico da posicao atual
	// para definir se a celula atual tambem e uma maxima local
	var aux = hc_def_heuristic_val(height, width);
	// Variavel que guarda o nome do movimento a ser executado
	var aux_name = "stay"

	// Para cada uma das 4 direcoes
	directions_names.forEach(
		function(direction){
			// Se a celula vizinha da direcao em questao
			// tiver valor heuristico menor que a menor celula vizinha ate entao encontrada
			if (directions[direction] < aux) {
				// Define aux como essa celula vizinha
				aux = directions[direction];
				// Define o nome do movimento como a direcao da celula vizinha
				// em relacao a celula atual
				aux_name = direction;
				// Esvazia a variavel empate pois existe uma direcao unica
				// com menor valor heuristico
				empate = [];
			// Caso a celula vizinha em questao possuir o mesmo valor heuristico
			// que a menor celula vizinha ate entao encontrada
			} else if (directions[direction] == aux) {
				// Pega a celula anteriormente em questao
				// e a celula atualmente em questao e adiciona no array de empate
				empate[0] = aux_name;
				empate[1] = direction; 
			}
	  	}
	);

	var nextStep = "Not Defined";
	var otherPossibleStep = "Not Defined";
	var otherPossibleHeight = -1;
	var otherPossibleWidth = -1;
	var obs;

	// Caso haja um empate entre os menores valores Heuristicos
	if (empate.length) {
		// Sorteia a próx celula
		var coinToss = Math.floor((Math.random() * 10) + 1)%2;
		nextStep = empate[coinToss];

		// Envia a celula não escolhida para retornar
		// caso a maxima global não seja encontrada
		otherPossibleStep = empate[1-coinToss];
		otherPossibleHeight = height + direct_mod_h[otherPossibleStep];
		otherPossibleWidth = width + direct_mod_w[otherPossibleStep];
		obs = "Draw" // Empate

	} else { // Caso contrario, pega a celula de menor valor
		nextStep = aux_name;
		obs = "Move "+aux_name;
	}

	if (aux_name == "stay") return [height, width, "Maxima Local", -1, -1];

	// Se o valor AUX for 0, então a próx celula é a Maxima Global
	if (!aux) obs = "Move "+aux_name+" to the end.";

	return [ /* New Height */ height + direct_mod_h[nextStep],
	 		 /* New Width */ width + direct_mod_w[nextStep],
	 	 	 /* OBS */  obs,
	 	 	 /* Other Possible New Height */ otherPossibleHeight,
	 	 	 /* Other Possible New Height */ otherPossibleWidth];
}

function hill_climbing() {
	load(0); // Limpa o mapa
	// var onlyFirstPath = document.getElementById("firstPath").checked;
	var allPaths = []; // Matriz tripla para armazenar os caminhos percorridos
	var actualPath = 0; // Numero do indice na matriz "allPaths" que esta sendo ultilizado
	var actualPos; // Posição atual
	var result; // Array para guardar o retorno da funcao "hc_evaluate_neighboorhood"

	//startTime = new Date().getTime();
	allPaths[0] = [[startPos[0][0], startPos[0][1]]];
	actualPos = [startPos[0][0], startPos[0][1]];
	coming_from = "none";
	result = [];

	// Começa a contar o tempo de execução do algoritmo
	startTime = new Date().getTime();

	do {
		// Avalia a vizinhaca e pega a celula de menor valor Heuristico
		// Se ocorrer um empate, sorteia uma dar celulas para dar continuidade.
		// Caso o caminho proveniente desta alcance apenas uma maxima local,
		// volta para a celula não sorteada no empate e da continuidade 
		result = hc_evaluate_neighboorhood(actualPos[0],actualPos[1]);

		// Define a nova posição atual baseado no retorno da função anterior
		actualPos = [result[0], result[1]];

		// Aloca espaço para armazenar a mensagem recebida da funcão anterior,
		// Usado para debugar e para definir ações em caso de empate ou de maxima local atingida.
		obs = result[2];

		// Em caso de Empate
		if (obs == "Draw") {
			// Copia o caminho atual
			allPaths[actualPath+1] = Array.from(allPaths[actualPath]);

			// Adiciona no caminho atual o caminho alternativo do empate
			allPaths[actualPath].push([result[3], result[4]]);

			// Aponta para o novo caminho onde a celula 
			// decidida no empate será a proxima celua a ser ocupada
			actualPath++;
		}

		// Marca no mapa os cominhos percorridos
		replaceAt(result[0] * mapWidth + result[1] , "=");

		// Inclui o movimento na lista de caminho
		allPaths[actualPath].push([result[0], result[1]]);

		// Em caso de Maxima local atingida
		if (obs == "Maxima Local") {
			if (!actualPath) {break;}

			// Exclui o caminho que levou a maxima local
			allPaths[actualPath].pop();

			actualPath--; // Volta ao ultimo caminho para dar continuidade
			// Retorna a ultima posição ocupada
			var last_cell = allPaths[actualPath].length - 1;
			actualPos = allPaths[actualPath][last_cell];
			replaceAt(actualPos[0] * mapWidth + actualPos[1] , "=");
		}
		
	} while ((actualPos[0] != endPos[0][0] || actualPos[1] != endPos[0][1]));
	
	replaceAt(endPos[0][0] * mapWidth + endPos[0][1] , "$");
	// Renderiza caminho percorrido cuja maxima global foi encontrada
	renderBestPath(allPaths[actualPath]);
}

function deepSearch() {
	load(0)
	var shortestPath = document.getElementById("shortestPath").checked
	var bestPath = []
	var nodes = getChildNodes(startPos,false)	
	startTime = new Date().getTime()
	while (nodes.length > 0) {					
		if (nodes[0][0][0] == endPos[0][0] && nodes[0][0][1] == endPos[0][1]) {	 // End				
			if(bestPath.length==0){			
				for(var j=0;j<nodes[0].length-1;j++)bestPath.push([nodes[0][j][0],nodes[0][j][1]]);								
			}else{				
				if(bestPath.length>nodes[0].length-2) {
					bestPath=[]
					for(var j=0;j<nodes[0].length-1;j++)bestPath.push([nodes[0][j][0],nodes[0][j][1]])												
				}
			}			
			nodes.splice(0, 1)
			if(!shortestPath){
				renderBestPath(bestPath)
				return
			}	
			continue
		}										
		var childNodes = getChildNodes(nodes[0],false)				
		var walkedPath = nodes[0][0][1] + (nodes[0][0][0] * mapWidth)
		replaceAt(walkedPath, "=")
		nodes.splice(0, 1)		
		if(childNodes.length>0){
			for (var h = 3; h >= 0; h--) {		
				if(childNodes.length>=h+1)if (childNodes[h].length!=0)nodes.unshift(childNodes[h])
			}
		}													
	}
	renderBestPath(bestPath)	
}

function bestFirstSearch() {	
	load(0)
	var shortestPath = document.getElementById("shortestPath").checked
	var bestPath = []
	var xDiff = Math.abs(endPos[0][0]-startPos[0][0])
	var yDiff = Math.abs(endPos[0][1]-startPos[0][1])
	var newVectorStart = [startPos[0][0],startPos[0][1],xDiff+yDiff]	
	startPos = []
	startPos.push(newVectorStart)
	startPos.push(newVectorStart)	
	var nodes = getChildNodes(startPos,true)	
	for(var i=1;i<nodes.length;i++){				
		if(nodes[0][0][2]>nodes[i][0][2]){		
			var aux = nodes[0]
			nodes[0] = nodes[i]
			nodes[i] = aux		
		}
	}	
	startTime = new Date().getTime()
	while (nodes.length > 0) {						
		if (nodes[0][0][0] == endPos[0][0] && nodes[0][0][1] == endPos[0][1]) {	 // End				
			if(bestPath.length==0){			
				for(var j=0;j<nodes[0].length-1;j++)bestPath.push([nodes[0][j][0],nodes[0][j][1]]);								
			}else{				
				if(bestPath.length>nodes[0].length-2) {
					bestPath=[]
					for(var j=0;j<nodes[0].length-1;j++)bestPath.push([nodes[0][j][0],nodes[0][j][1]])												
				}
			}			
			nodes.splice(0, 1)
			if(!shortestPath){
				renderBestPath(bestPath)
				return
			}	
			continue
		}											
		var childNodes = getChildNodes(nodes[0],true)				
		var walkedPath = nodes[0][0][1] + (nodes[0][0][0] * mapWidth)
		replaceAt(walkedPath, "=")
		nodes.splice(0, 1)		
		if(childNodes.length>0){
			for (var h = 3; h >= 0; h--) {		
				if(childNodes.length>=h+1)if (childNodes[h].length!=0)nodes.unshift(childNodes[h])
			}
		}
		for(var i=1;i<nodes.length;i++){
			
			if(nodes[0][0][2]>nodes[i][0][2]){
				var aux = nodes[0]
				nodes[0] = nodes[i]
				nodes[i] = aux		
			}
		}													
	}
	renderBestPath(bestPath)	
}

function getChildNodes(pos, withHeuristic) {
	let leftNode = []
	let downNode = []
	let rightNode = []
	let upNode = []	
	const stringPos = pos[0][1] + (pos[0][0] * mapWidth)	
	if (Math.floor((stringPos - 1) / mapWidth) == Math.floor(stringPos / mapWidth)) { // Check if new position still in the same line.	
		if (mapStr[stringPos - 1] != '-') { // Wall
			var flgVisited = false
			for (var i = pos.length - 1; i > 0; i--) { // Check if collided with visited path.
				if (pos[i][0] == pos[0][0] && pos[i][1] == pos[0][1] - 1) {
					flgVisited = true
					break;
				}
			}
			if (!flgVisited) {
				if(withHeuristic){					
					var xDiff = Math.abs(endPos[0][0]-(pos[0][0]))
					var yDiff = Math.abs(endPos[0][1]-(pos[0][1] - 1)) 					
					leftNode.push([pos[0][0], pos[0][1] - 1, xDiff+yDiff])
					leftNode.push([pos[0][0], pos[0][1], pos[0][2]])
					for (var i = 1; i < pos.length; i++) { // Pass to children the visited path of father.
						leftNode.push([pos[i][0], pos[i][1], pos[i][2]])
					}		
				}else{
					leftNode.push([pos[0][0], pos[0][1] - 1])
					leftNode.push([pos[0][0], pos[0][1]])
					for (var i = 1; i < pos.length; i++) { // Pass to children the visited path of father.
						leftNode.push([pos[i][0], pos[i][1]])
					}		
				}
						
			}
		}
	}
	if (Math.floor((stringPos + 1) / mapWidth) == Math.floor(stringPos / mapWidth)) { // Check if new position still in the same line.	
		if (mapStr[stringPos + 1] != '-') { // Wall
			var flgVisited = false;
			for (var i = pos.length - 1; i > 0; i--) { // Check if collided with visited path.
				if (pos[i][0] == pos[0][0] && pos[i][1] == pos[0][1] + 1) {
					flgVisited = true;
					break;
				}
			}
			if (!flgVisited) {
				if(withHeuristic){
					var xDiff = Math.abs(endPos[0][0]-(pos[0][0]))
					var yDiff = Math.abs(endPos[0][1]-(pos[0][1] + 1)) 
					rightNode.push([pos[0][0], pos[0][1] + 1, xDiff+yDiff])
					rightNode.push([pos[0][0], pos[0][1], pos[0][2]])
					for (var i = 1; i < pos.length; i++) { // Pass to children the visited path of father.
						rightNode.push([pos[i][0], pos[i][1], pos[i][2]])
					}
				}else{
					rightNode.push([pos[0][0], pos[0][1] + 1])
					rightNode.push([pos[0][0], pos[0][1]])
					for (var i = 1; i < pos.length; i++) { // Pass to children the visited path of father.
						rightNode.push([pos[i][0], pos[i][1]])
					}
				}								
			}
		}
	}
	if(pos[0][0]-1 > 0){ // Check if exists a line to go up.
		if(mapStr[stringPos-mapWidth]!='-'){
			var flgVisited = false;
			for (var i = pos.length - 1; i > 0; i--) { // Check if collided with visited path.
				if (pos[i][0] == pos[0][0] - 1 && pos[i][1] == pos[0][1]) {
					flgVisited = true;
					break;
				}
			}
			if (!flgVisited) {
				if(withHeuristic){
					var xDiff = Math.abs(endPos[0][0]-(pos[0][0]-1))
					var yDiff = Math.abs(endPos[0][1]-(pos[0][1]))
					upNode.push([pos[0][0]-1, pos[0][1], xDiff+yDiff])
					upNode.push([pos[0][0], pos[0][1], pos[0][2]])
					for (var i = 1; i < pos.length; i++) { // Pass to children the visited path of father.
						upNode.push([pos[i][0], pos[i][1], pos[i][2]])
					}	
				}else{
					upNode.push([pos[0][0]-1, pos[0][1]])
					upNode.push([pos[0][0], pos[0][1]])
					for (var i = 1; i < pos.length; i++) { // Pass to children the visited path of father.
						upNode.push([pos[i][0], pos[i][1]])
					}	
				}							
			}
		}
	}	
	if(pos[0][0]+1 < mapHeight){ // Check if exists a line to go up.
		if(mapStr[stringPos+mapWidth]!='-'){
			var flgVisited = false;
			for (var i = pos.length - 1; i > 0; i--) { // Check if collided with visited path.
				if (pos[i][0] == pos[0][0] + 1 && pos[i][1] == pos[0][1]) {
					flgVisited = true;
					break;
				}
			}
			if (!flgVisited) {
				if(withHeuristic){
					var xDiff = Math.abs(endPos[0][0]-(pos[0][0]+1))
					var yDiff = Math.abs(endPos[0][1]-(pos[0][1]))
					downNode.push([pos[0][0]+1, pos[0][1], xDiff+yDiff])
					downNode.push([pos[0][0], pos[0][1], pos[0][2]])
					for (var i = 1; i < pos.length; i++) { // Pass to children the visited path of father.
						downNode.push([pos[i][0], pos[i][1], pos[i][2]])
					}
				}else{
					downNode.push([pos[0][0]+1, pos[0][1]])
					downNode.push([pos[0][0], pos[0][1]])
					for (var i = 1; i < pos.length; i++) { // Pass to children the visited path of father.
						downNode.push([pos[i][0], pos[i][1]])
					}
				}								
			}
		}
	}	
	let notEmptyNodes = []
	if(rightNode.length > 0)notEmptyNodes.push(rightNode);	
	if(downNode.length > 0)notEmptyNodes.push(downNode);
	if(leftNode.length > 0)notEmptyNodes.push(leftNode);
	if(upNode.length > 0)notEmptyNodes.push(upNode);
	return notEmptyNodes;
}

function replaceAt(index, replacement) {
	mapStr = mapStr.substr(0, index) + replacement + mapStr.substr(index + replacement.length);
}

function mapDataStructure() {
	const arrayLenght = mapWidth * mapHeight
	for (let i = 0; i < arrayLenght; i++) {
		switch (mapStr[i]) {
			case '*':
				mapPixel[i] = 1;
				break;
			case '-':
				mapPixel[i] = 0;
				break;
			case '#':
				mapPixel[i] = 2;
				var posY = Math.floor(i % mapWidth);
				var posX = Math.floor(i / mapWidth);				
				startPos.push([posX, posY]);
				startPos.push([posX, posY]); // Already visited path											
				break;
			case '$':
				mapPixel[i] = 3;
				var posY = Math.floor(i % mapWidth);
				var posX = Math.floor(i / mapWidth);
				endPos.push([posX, posY]);						
				break;
			case '=':
				mapPixel[i] = 4;
				break;
			case '@':
				mapPixel[i] = 5;
				break;
		}
	}	
}

function renderMap() {
	let html = '<table cellpadding=0 cellspacing=0>'
	for (let row = 0; row < mapHeight; row++) {
		html += '<tr>'

		for (let column = 0; column < mapWidth; column++) {
			const pixelIndex = column + (mapWidth * row)
			const color = mapPalette[mapPixel[pixelIndex]]
			const colorString = `${color.r},${color.g},${color.b}`
			if (debug) {
				html += '<td>'
				//index in cell's top corner
				html += `<div class="pixel-index">${pixelIndex}</div>`

				//Pallet color number
				html += `<div style="color: rgb(${colorString});">${mapPixel[pixelIndex]}</div>`
			} else {

				html += `<td class="pixel" style="background-color: rgb(${colorString})">`

			}

			html += '</td>'
		}
		html += '</tr>'
	}
	html += '</table>'
	document.querySelector('#mapCanvas').innerHTML = html
}

function load(map) {
	if(map==0){mapWidth = parseInt(document.getElementById("numberCol").value)
	mapHeight = parseInt(document.getElementById("numberRow").value)
	mapStr = document.getElementById("map").value
	if (mapWidth * mapHeight != mapStr.length) {
		document.getElementById("lblWarning").innerHTML = "Entradas invalidas!"
		return
	} else document.getElementById("lblWarning").innerHTML = ""
}else if(map==1){
	mapStr = "**#*********--*************----*-----*--*-----*----**----*-----*--*-----*----**----*-----*--*-----*----***************************-----*--*--------*--*----*-----*--*--------*--*----*******--****--****--******-----*-----*--*-----*----------*-----*--*-----*----------*--**********--*----------*--*--------*--*----------*--*--------*--*-----*********--------*********-----*--*--------*--*----------*--*--------*--*----------*--**********--*----------*--*--------*--*----------*--*--------*--*-----************--*************----*-----*--*-----*----**----*-----*--*-----*----****--****************--***--*--*--*--------*--*--*----*--*--*--------*--*--*--******--****--****--*******----------*--*----------**----------*--*----------***********************$***"
	mapWidth = 26
	mapHeight = 29
}else if(map==2){
	mapWidth = 52
	mapHeight = 29
	mapStr = "**#*********--******************-----*--*-----*----**----*-----*--*-----*----*--*--*******--****--********************************-*-*-*--*--------*--*----*--*--*--*--*--*--*--*----*******--****--****--******--*--*--*--*--*--*--****--*----*--*--*--*--*--*-------*--*--**********--*-----*----*--*--****--*--*-------*--*--*-*----*-*--******************--******************--*-*----*-*--*--*-------*--*--------*--*-----*----*--**********--*--*-------*--*--------*--*-----***--****--*--*--****--*-*************--*************-*--*-----*--*-----*--*-*--*--*--*--****--*--*--*-**********************--***--*--*--*--*--*--*--*--*-**-*--*--*--*--*--*--*--*-*******--****--*************-*--*--*--*--*--*--*--*-*-----------*--*---*---*--***************************************--*************----*-----*--*--*--*-*--*-----*-----*--*-----*----**-****************--***--****************************-*--*--*--------*--*----*-----*--*--*--*--*--*----*******--****--****--******-----*--*--*--*--*--*----**----*-----*--*-----*----*******--**********--*******----*--****--****--*----*-----*--*--*--*--*--*-----*********-----*--***********---****--*--*--****--------*-*--*****-*--*--*----*-*****--**********--******---*-*--*---*-*--*--*----*-----*--*--*--*--*--*-*--****************************----*--*--*--*--*--*-*--**-*--*--*--*--*--*--*--*--***--**********************-*--*--*--****--*--*--*----*--*--*--*--*--*--*--*-**-*--*--****--****--******--*--*--*--*--*--*--*--*-*******-----****--****----***********************$***"
}else if(map==3){
	mapWidth = 50
	mapHeight = 50
	mapStr = "--------------------------------------------------**---***#**********-**---***--*-*****************--***-*****-**-*********--*-*-*****-****-**-***-**--*-***-******--**-*******************-*-*****-***--*******************-****-***-*******-******-***---***-**************-**-***-*******************-**--****-***********-**---****--*********-**********--*****-*-*-*--*********-***-*-**--**********-***---******-**----******--*-****-*******-***********---**-*******-*-**-*--*****--***-***********-*-****--**-**-*******-**-*-*-**********--***-******--***--*-**-*********-***********--******-*************---***-***-*-****-*-***-********---***-******-****--**-**-**-***-**-*-***********************-******--*-***-**-****-****-*******--**************-*****--**--*-****************--*****-***-********-**-*---*-**************************-**-*********--****----********-**-*-*****---****-*********-**********--***--************-**-****--********--**--******-----**-***-***-*******-*-**-***-**-*-***********-*--***-**************-*******-******-***-**-**-****--*******--***************--***********-*******--*--**-*-*****-********-**--*-****-************-*--*---*****************-**-*******-**-*****-**-******--***-***-*****-****-********-**-*-***--*--****-**--*****-*********-******-*-*-***********-***--****--**--********-*-**********-***********-***-******---*****-**--**********-***--*--*****-************--*-*-***--*-***-*-*--**---*--********-*****-*****---*****************-****---*-*******-*****-***-**---**-****-*******************--*-*****-**********--*-*********-******--*****-**-****-**--*****-****--*-****-********-*******-*******-**-*************---*****-**********-**********-***********--*-****---**-*-*******--********-*************-*-***-***---***-*****-********--**-*-**-*******--******-****---**-***-******************----******************--********-**-*---***************-*******-********--**-***-*********************--****-**********-**--**-**********-**-*--*****-*-*-**-*****--*--***-*--********-*****************-***-***--********-**---*-****-****--******--**-****-*-**-*****-******----**-*-*-*--***-*********-****-********-*-*****-**----*-**-***-***-*****-**********-************-*-*--***-*-*-*-*********--*-*--***-******************--**************************-*****-***-****-******---****-*******-*****--***************************--******--*****-**********--*****-***-**-**--*****--****-****-**-*****-**************-******-**--*$**--------------------------------------------------"
}
	setFields()
	start()
}

function debugMode() {
	if (debug) {
		debug = false;
	} else {
		debug = true;
	}

	mapDataStructure()
	renderMap()
}

setFields()
start()