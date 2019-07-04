
var TetrisVisual = function(container){
	this.container = document.getElementById(container);
	this.createdVisualBlocks = [];
	this.pointsDisplay = null;
};

TetrisVisual.prototype.build = function(){
	this.buildTetrisElement();
	this.buildPointsDisplay();
}

TetrisVisual.prototype.buildTetrisElement = function(){
	
	var rows = [];
	
	for(var rows_counter = 0;rows_counter < 16; rows_counter++){
		
		var row = [];
		
		for(var columns_counter = 0;columns_counter < 10; columns_counter++){
			
			var newBlock = document.createElement("div");
			newBlock.classList.add("block");
			row.push(newBlock);
			this.container.appendChild(newBlock);
			
		}
		
		rows.push(row);
		
	}
	
	this.createdVisualBlocks = rows;
	
}

TetrisVisual.prototype.buildPointsDisplay = function(){
	var pointsDisplay = document.createElement("label");
	pointsDisplay.innerHTML = "Points: 0";
	document.body.appendChild(pointsDisplay);
	this.pointsDisplay = pointsDisplay;
}

TetrisVisual.prototype.updatePointsDisplay = function(points){
	this.pointsDisplay.innerHTML = "Points: " + points;
}

TetrisVisual.prototype.update = function(tetrisBlocks){
	
	var tetrisBlocksCopy = JSON.parse(JSON.stringify(tetrisBlocks));
	
	for(var rows_counter = 0;rows_counter < tetrisBlocksCopy.length; rows_counter++){

		for(var columns_counter = 0;columns_counter < tetrisBlocksCopy[rows_counter].length; columns_counter++){
			
			if(tetrisBlocksCopy[rows_counter][columns_counter] !== null){
				var block = tetrisBlocksCopy[rows_counter][columns_counter];
				this.createdVisualBlocks[rows_counter][columns_counter].style.backgroundColor = block.color;
			}else{
				this.createdVisualBlocks[rows_counter][columns_counter].style.backgroundColor = "";
			}
			
		}
		
	}
	
}

TetrisVisual.prototype.createRandomColor = function(){
	return '#' + Math.random().toString(16).slice(2, 8).toUpperCase();
}