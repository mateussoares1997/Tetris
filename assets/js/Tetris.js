/*
 *  Tetris created by Mateus Soares <https://github.com/mateussoares1997>
 */

var Tetris = function(params){

	this.gameData ={
        //Game points
        points: 0,
        //Stage of the game
        stage: 1,
        //Couter
        finishedPiecesCycleCounter: 0
    }
    
    this.status = 'start';

	this.config = params;
	this.config.speed = this.config.normalSpeed;
	this.visual = new TetrisVisual(
                        params.container,
                        params.nextPiecesListContainer,
                        params.pointsDisplay
                    );
	
	//The main Tetris array with all blocks  
	this.tetrisBlocks = [];

	//Current piece position object (left, bottom)
	this.piecePosition = {};

	//Current piece object
    this.piecesList = [];
    this.createPiecesList(4);
    this.currentPieceShape = [];

	this.createBlocks();
	this.visual.build();
    this.createEventsListeners();
    
    this.menu = new TetrisMenu(
        params,
        this
    );

    if(params.autostart){
        this.menu.start();
    }

};

//Builds main Tetris array (16 x 10)
Tetris.prototype.createBlocks = function(){

	var rows = [];

	//Creatig 16 rows
	for(var rowsCounter = 0;rowsCounter < 16; rowsCounter++){

		var row = [];

		//Creating 10 columns
		for(var columnsCounter = 0;columnsCounter < 10; columnsCounter++){
			row.push(null);
		}

		rows.push(row);
	}
	
	this.tetrisBlocks = rows;

}

Tetris.prototype.createEventsListeners = function(){

    var self = this;
    
	window.addEventListener("keydown", function(event){

		switch (event.code) {
			case "Space":
				self.rotatePiece();
			break;
			case "ArrowLeft":
				self.movePieceTo("left");
			break;
			case "ArrowRight":
				self.movePieceTo("right");
			break;
			case "ArrowDown":
				self.changeSpeed(self.config.normalSpeed/8);
			break;
			default:
				//console.log(event.code);
			break;
		}
	
	});
	
	window.addEventListener("keyup", function(event){

		switch (event.code) {
			case "ArrowDown":
				self.changeSpeed(self.config.normalSpeed);
			break;
			default:
				//console.log(event.code);
			break;
		}
	
    });

}	

Tetris.prototype.startPieceCircle = function(){

	//Reset game speed to normal (for a better gameplay)
	this.changeSpeed(this.config.normalSpeed);

	//Cleaning previous piece left position to prevent some bugs
    this.leftPositionBeforeRotation = null;
    
    //If the game is not in the first piece cycle than it won't refresh game pieces list
    if(this.gameData.finishedPiecesCycleCounter !== 0){
        this.refreshPiecesList();
    }

    this.refreshCurrentPieceShape();
    this.visual.updateNextPiecesListContainer(this.piecesList);
	
    var pieceLength = this.currentPieceShape[0].length;
    
	//Setting the initial position
	this.piecePosition = {
		leftPosition: Math.floor((10 - pieceLength)  / 2), 
		bottomPosition: -1,
	}

	this.visual.updatePointsDisplay(this.gameData.points);
	this.runCircle();

}

Tetris.prototype.runCircle = function(){

	var self = this;

	setTimeout(function(){

        if(self.status !== 'running'){
            self.runCircle();
            return;
        }

		self.clearTemporaryBlocks();

		//Checks whether collision will happen in piece drop, if it's not so then the piece will drop and try to drop again
		if(!(self.detectCollision(1))){

			self.piecePosition.bottomPosition++;
	
			self.updatePiecePosition();
			
			//console.log("Current tetrisBlocks state", self.tetrisBlocks);
			
			//If piece position was updated successfully, tries update again by calling itself
			self.runCircle();

		}else{

            //If collision was detected stores current shape position and finish cicle
            if(self.detectIfGameIsOver()){
                self.menu.end();
                return;
            }

            self.fastenPiecePosition();

            self.gameData.finishedPiecesCycleCounter++;

			self.checkForGamePoints();
			
			//Also starts a new shape circle
			self.startPieceCircle();
			
		}
		
		//Updates visual display every circle time
		self.visual.update(self.tetrisBlocks);
		
	}, self.config.speed);

}

Tetris.prototype.detectCollision = function(bottomPositionIncrement, piecePosition, pieceShape){

	var isColliding = 0;
	var piecePositionToTest = piecePosition ? piecePosition : this.piecePosition;
	var pieceShapeToTest = pieceShape ? pieceShape : this.currentPieceShape;

	var intendedPiecePosition = JSON.parse(JSON.stringify(piecePositionToTest));
	intendedPiecePosition.bottomPosition += bottomPositionIncrement;

	//Calculating intended top position
	intendedPiecePosition.topPosition = intendedPiecePosition.bottomPosition - (pieceShapeToTest.length - 1);

	for(var pieceRowsCounter = 0;pieceRowsCounter < pieceShapeToTest.length; pieceRowsCounter++){

		for(var pieceColumnsCounter = 0;pieceColumnsCounter < pieceShapeToTest[pieceRowsCounter].length; pieceColumnsCounter++){

			var tretisBlocksRowIndex = intendedPiecePosition.topPosition + pieceRowsCounter;
			var tretisBlocksColumnIndex = intendedPiecePosition.leftPosition + pieceColumnsCounter;

			
			if(typeof this.tetrisBlocks[tretisBlocksRowIndex] !== "undefined"){
				/* 
					console.log("tretisBlocksRowIndex", tretisBlocksRowIndex);
					console.log("tretisBlocksColumnIndex", tretisBlocksColumnIndex);
					console.log(this.tetrisBlocks[tretisBlocksRowIndex][tretisBlocksColumnIndex]);
					console.log(this.tetrisBlocks[tretisBlocksRowIndex][tretisBlocksColumnIndex] === null); 
				*/
				if(this.tetrisBlocks[tretisBlocksRowIndex][tretisBlocksColumnIndex] !== null && pieceShapeToTest[pieceRowsCounter][pieceColumnsCounter] !== null && (typeof this.tetrisBlocks[tretisBlocksRowIndex][tretisBlocksColumnIndex] === "undefined" || !this.tetrisBlocks[tretisBlocksRowIndex][tretisBlocksColumnIndex].isTemporary)){
					isColliding++;
				}

			}else if(tretisBlocksRowIndex === 16){
				isColliding++;
			}

		}

	}

	return isColliding > 0;

}

Tetris.prototype.fastenPiecePosition = function(){

	var intendedPiecePosition = JSON.parse(JSON.stringify(this.piecePosition));

	//Calculating intended top position
	intendedPiecePosition.topPosition = intendedPiecePosition.bottomPosition - (this.currentPieceShape.length - 1);

	for(var pieceRowsCounter = 0;pieceRowsCounter < this.currentPieceShape.length; pieceRowsCounter++){

		for(var pieceColumnsCounter = 0;pieceColumnsCounter < this.currentPieceShape[pieceRowsCounter].length; pieceColumnsCounter++){

			var tretisBlocksRowIndex = intendedPiecePosition.topPosition + pieceRowsCounter;
            var tretisBlocksColumnIndex = intendedPiecePosition.leftPosition + pieceColumnsCounter;
            
			if(this.currentPieceShape[pieceRowsCounter][pieceColumnsCounter] !== null){
				this.tetrisBlocks[tretisBlocksRowIndex][tretisBlocksColumnIndex] = this.currentPieceShape[pieceRowsCounter][pieceColumnsCounter];
				this.tetrisBlocks[tretisBlocksRowIndex][tretisBlocksColumnIndex].isTemporary = false
			}

		}

	}

}

Tetris.prototype.clearTemporaryBlocks = function(){
	
	for(var rowsCounter = 0;rowsCounter < this.tetrisBlocks.length; rowsCounter++){

		for(var columnsCounter = 0;columnsCounter < this.tetrisBlocks[rowsCounter].length; columnsCounter++){

			if(this.tetrisBlocks[rowsCounter][columnsCounter] !== null && this.tetrisBlocks[rowsCounter][columnsCounter].isTemporary){
				this.tetrisBlocks[rowsCounter][columnsCounter] = null;
			}

		}

	}

}

Tetris.prototype.updatePiecePosition = function(){

	var intendedPiecePosition = JSON.parse(JSON.stringify(this.piecePosition));
	
	//Calculating intended top position
	intendedPiecePosition.topPosition = intendedPiecePosition.bottomPosition - (this.currentPieceShape.length - 1);

	for(var shapeRowsCounter = 0;shapeRowsCounter < this.currentPieceShape.length; shapeRowsCounter++){

		for(var shapeColumnsCounter = 0;shapeColumnsCounter < this.currentPieceShape[shapeRowsCounter].length; shapeColumnsCounter++){

			var tretisBlocksRowIndex = intendedPiecePosition.topPosition + shapeRowsCounter;
			var tretisBlocksColumnIndex = intendedPiecePosition.leftPosition + shapeColumnsCounter;
			
			//Updates current shape position in main array 
			if(typeof this.tetrisBlocks[tretisBlocksRowIndex] !== "undefined" && this.currentPieceShape[shapeRowsCounter][shapeColumnsCounter] !== null){
				this.tetrisBlocks[tretisBlocksRowIndex][tretisBlocksColumnIndex] = this.currentPieceShape[shapeRowsCounter][shapeColumnsCounter];
				this.tetrisBlocks[tretisBlocksRowIndex][tretisBlocksColumnIndex].isTemporary = true;
			}

		}

	}

}

Tetris.prototype.createPieceArray = function(){

	var pieceColor = this.visual.createRandomColor();

	var arrayShapesArray = [
		[
			[{color: pieceColor}, {color: pieceColor}],
			[{color: pieceColor}, {color: pieceColor}]
		],
		[
			[{color: pieceColor}],
			[{color: pieceColor}],
			[{color: pieceColor}],
			[{color: pieceColor}],
		],
		[
			[null, {color: pieceColor}, {color: pieceColor}],
			[{color: pieceColor}, {color: pieceColor}, null]
		],
		[
			[{color: pieceColor},{color: pieceColor}, null],
			[null,{color: pieceColor},{color: pieceColor}]
		],
		[
			[{color: pieceColor},null],
			[{color: pieceColor},null],
			[{color: pieceColor},{color: pieceColor}],
		],
		[
			[null,{color: pieceColor}],
			[null,{color: pieceColor}],
			[{color: pieceColor},{color: pieceColor}],
		],
		[
			[{color: pieceColor},{color: pieceColor},{color: pieceColor}],
			[null,{color: pieceColor},null]
		],
	]
	
	return arrayShapesArray[Math.floor(Math.random() * 7)];
		
}

Tetris.prototype.rotatePiece = function(){

	var rotatedPiece = [];

	//Rotating piece to the right
	for(columnCounter = 0;columnCounter < this.currentPieceShape[0].length; columnCounter++){

		var row = [];

		for(rowCounter = (this.currentPieceShape.length -1);rowCounter > -1; rowCounter--){

			row.push(this.currentPieceShape[rowCounter][columnCounter]);
	
		}

		rotatedPiece.push(row);

	}

	var piecePositionCopy = JSON.parse(JSON.stringify(this.piecePosition));
	
	var pieceSizes = {
		rows: rotatedPiece.length,
		columns: rotatedPiece[0].length
	}

	//If the left position was changed by rotating the piece returns it to the left position before rotation
	if(this.leftPositionBeforeRotation !== null && typeof this.leftPositionBeforeRotation !== "undefined"){

		var aux = piecePositionCopy.leftPosition;

		piecePositionCopy.leftPosition = this.leftPositionBeforeRotation;

		if(this.detectCollision(0, piecePositionCopy, rotatedPiece)){
			piecePositionCopy.leftPosition = aux;
		}

		this.leftPositionBeforeRotation = null;

	}

	//Centers the piece when rotating
	if(rotatedPiece[0].length < this.currentPieceShape[0].length){

		piecePositionCopy.leftPosition++;

		if(!this.detectCollision(0, piecePositionCopy, rotatedPiece)){
			this.leftPositionBeforeRotation = piecePositionCopy.leftPosition - 1;
		}else{
			piecePositionCopy.leftPosition--;
		}

	}

	var success = false;

	for(var countColumns = 0; countColumns < (pieceSizes.columns + 1); countColumns++){
		
		if(!this.detectCollision(0, piecePositionCopy, rotatedPiece) && !success){

			this.clearTemporaryBlocks();
			this.currentPieceShape = rotatedPiece;

			this.piecePosition = JSON.parse(JSON.stringify(piecePositionCopy));
			this.updatePiecePosition();

			this.visual.update(this.tetrisBlocks);
			success = true;
			
		}else{
			piecePositionCopy.leftPosition--;
		}

	}

}

Tetris.prototype.movePieceTo = function(direction){
	
	var movedPiecePosition = JSON.parse(JSON.stringify(this.piecePosition));
	var positionChanged = false;
	
	if(direction === "left"){	
		
		if(this.piecePosition.leftPosition > 0){
			movedPiecePosition.leftPosition--;
			positionChanged = true;
		}
		
	}else if(direction === "right"){
		
		if(this.piecePosition.leftPosition < (10 - this.currentPieceShape[0].length)){
			movedPiecePosition.leftPosition++;
			positionChanged = true;
		}
		
	}
	
	if(positionChanged && !(this.detectCollision(0, movedPiecePosition))){
		//Cleaning previous piece left position to prevent some bugs
		this.leftPositionBeforeRotation = null ;
		this.piecePosition = movedPiecePosition;
		this.clearTemporaryBlocks();
		this.updatePiecePosition();
		this.visual.update(this.tetrisBlocks);
	}
	
}

Tetris.prototype.checkForGamePoints = function(){

	for(var rowCounter = 15; rowCounter > 0; rowCounter--){

		//if row is complete:
		if(this.tetrisBlocks[rowCounter].indexOf(null) === -1){

			this.gameData.points += this.gameData.stage * 100;
			
			for(var rowCounterTwo = rowCounter;  rowCounterTwo > 0; rowCounterTwo--){
				this.tetrisBlocks[rowCounterTwo] = JSON.parse(JSON.stringify(this.tetrisBlocks[rowCounterTwo-1]));
			}

			rowCounter++;

		}

	}

}

Tetris.prototype.changeSpeed = function(speed){

	this.config.speed = speed;
	
}

Tetris.prototype.detectIfGameIsOver = function(){

    var currentPiecePosition = JSON.parse(JSON.stringify(this.piecePosition));

    //Calculating intended top position
    currentPiecePosition.topPosition = currentPiecePosition.bottomPosition - (this.currentPieceShape.length - 1);
    
    return currentPiecePosition.topPosition < 0;
    
};

Tetris.prototype.createPiecesList = function(listSize){

    //This array will contain 3 pieces
    var piecesList = [];

    for (var index = 0; index < listSize; index++) {
        piecesList[index] = this.createPieceArray();
    }

    this.piecesList = piecesList;

}

/**
 * Remove first piece of pieces list and create a new piece to be the last in the list
 */
Tetris.prototype.refreshPiecesList = function(){

    var pieceList = JSON.parse(JSON.stringify(this.piecesList));
    var pieceListSize = pieceList.length;
    var lastPieceListIndex = pieceListSize - 1;

    for (let index = 1; index < pieceListSize; index++) {
        pieceList[index - 1] = pieceList[index];
    }

    pieceList[lastPieceListIndex] = this.createPieceArray();

    this.piecesList = pieceList;

}

/**
 * Set current piece shape to the first piece of the pieces list
 */
Tetris.prototype.refreshCurrentPieceShape = function(){
    var fistPieceCopy = JSON.parse(JSON.stringify(this.piecesList[0]));
    this.currentPieceShape = fistPieceCopy;
}

Tetris.prototype.die = function(){
    this.visual.die();
}