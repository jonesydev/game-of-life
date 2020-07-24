// GameOfLife.js
//any live cell with less than 2 live neighbors dies
//any live cell with 2 or 3 live neighbors lives on to the next generation
//any live cell with more than 3 live neighbors dies
//any dead cell with exactly 3 neighbors becomes a live cell
//import * as AutomataGrid from '/automataGrid.js';

//import('./automataGrid.js');

var GameOfLife = (function() {
  "use strict";

  //import { grid } as AutomataGrid from './automataGrid.js';
  //import * as AutomataCell from "automataCell.js";

  var grid = {};
  var rows = [];
  var columns = [];
  var cellMatrix = [];
  var tempMatrix = [];
  var genesisMatrix = [];
  var neighbors = [];
  var cellDivs = [];
  var liveCellData = [];
  var generationData = [];
  var cellPopulationData = [];
  var defaultBackgroundColor = "white";
  var defaultNumberOfNeighbors = 8;
  var intervalID = -1;
  var numberOfLiveCells = 0;
  var numberOfGenerations = 0;
  var numberOfLiveCellsMax = 0;
  var b = {};
  var edgeWrapChecked = false;
  var rateMS = 250;
  var cellSize = 5;

  //d3 graph stuff
  var margin = {top: 20, right: 20, bottom: 30, left: 50};
  var width = 960 - margin.left - margin.right;
  var height = 500 - margin.top - margin.bottom;
  var x = d3.scaleTime().range([0, width]);
  var y = d3.scaleLinear().range([height, 0]);
  var svg = d3.select("body").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform",
          "translate(" + margin.left + "," + margin.top + ")");


  const FIRST_ROW = 1;
  const FIRST_COLUMN = 1;

  //Default dimensions for Still Life
  const DIMENSION_BLOCK = 4;
  const DIMENSION_BEEHIVE = 6;
  const DIMENSION_LOAF = 6;
  const DIMENSION_BOAT = 5;
  const DIMENSION_TUB = 5;

  //Default dimensions for Oscillators
  const DIMENSION_BLINKER = 5;
  const DIMENSION_TOAD = 6;
  const DIMENSION_BEACON = 6;
  const DIMENSION_PULSAR = 17;
  const DIMENSION_PENTADECATHLON = 19;

  //Default dimensions for Spaceships
  const DIMENSION_GLIDER = 45;
  const DIMENSION_LWSS = 45;
  const DIMENSION_MWSS = 45;
  const DIMENSION_HWSS = 45;

  //Default dimensions for Methuselahs
  const DIMENSION_R_PENTOMINO = 120;
  const DIMENSION_DIEHARD = 45;
  const DIMENSION_ACORN = 250;

  //Default dimensions for Infinites
  const DIMENSION_GOSPER_GLIDER_GUN = 45;


  //automata grid: put in AutomataGrid.js
  class Grid {

    constructor(dimension, cellNeighborhoodType) {
      this.dimension = dimension;
      this.cellNeighborhoodType = cellNeighborhoodType;
    }

    initGrid(dimension) {
      var numberOfRows = dimension;
      var numberOfColumns = dimension;
      var numberOfCells = 1;
      var gridElement = document.createElement("div");
      var gameBoardDiv = document.getElementById("board");

      b = document.body;
      numberOfGenerations = 0;

      gridElement.className = "grid-container";
      gridElement.id = "theGrid";
      //b.appendChild(gridElement);
      b.appendChild(gameBoardDiv);
      //gameBoardDiv.appendChild(gridElement);

      for (var i = 1; i <= this.dimension; i++) {
        rows[i] = document.createElement("div");
        rows[i].className = "row";
        rows[i].id = i;
        cellMatrix[i] = [];

        for (var j = 1; j <= this.dimension; j++) {
          var cell = new GameOfLife.Cell(numberOfCells, i, j, false, [], defaultBackgroundColor);

          cellDivs[numberOfCells] = document.createElement("div");
          cellDivs[numberOfCells].className = "cell";
          cellDivs[numberOfCells].id = "cell" + numberOfCells;
          cellDivs[numberOfCells].style.backgroundColor = defaultBackgroundColor;
          cellDivs[numberOfCells].dataset.row = i;
          cellDivs[numberOfCells].dataset.column = j;
          cellDivs[numberOfCells].dataset.isalive = "false";
          cellDivs[numberOfCells].addEventListener("click", cell.toggleCellColor);
          cellDivs[numberOfCells].addEventListener("click", cell.toggleAliveOrDead);
          cellDivs[numberOfCells].addEventListener("click", updateLiveCellCount);

          rows[i].appendChild(cellDivs[numberOfCells]);
          cellMatrix[i][j] = cell;
          numberOfCells++;
        }

        gridElement.appendChild(rows[i]);
      }

      //b.appendChild(gridElement);
      gameBoardDiv.appendChild(gridElement);
      this.assignNeighbors(numberOfRows, numberOfColumns);
    }

    //Use this to reset grid back to its initial seed after a run
    initGenesisGrid() {
      var rowCount = this.dimension;
      var columnCount = this.dimension;
      var numberOfCells = 1;

      for (var i = 1; i <= rowCount; i++) {
        genesisMatrix[i] = [];

        for (var j = 1; j <= columnCount; j++) {
          var cell = new GameOfLife.Cell(numberOfCells, i, j, false, [], defaultBackgroundColor);

          //cell = cellMatrix[i][j];
          genesisMatrix[i][j] = cell;
          numberOfCells++;
        }
      }

      transferCellData(cellMatrix, genesisMatrix);
    }

    //assigns each cell its neighbors as the grid is being initiallized
    assignNeighbors(rowCount, columnCount) {
      for (var i = 1; i <= rowCount; i++) {
        for (var j = 1; j <= columnCount; j++) {
          cellMatrix[i][j].setNeighbors(this.cellNeighborhoodType);
        }
      }
    }

    getCellNeighbors(cellID) {

    }
  }
  //End Class AutomataGrid

  //automata cell: put in AutomataCell.js
  class Cell {
    constructor(ID, row, column, isAlive, neighbors, backgroundColor) {
      this.ID = ID;
      this.row = row;
      this.column = column;
      this.isAlive = isAlive;
      this.neighbors = neighbors;
      this.backgroundColor = backgroundColor;
    }

    // //these neighbor functions are all Game of Life (well, any module that uses the Moore neighborhood) specific and can be extracted
    // //from the Cell class
    // setNeighborsCornerTopLeft(rowLength, columnLength) {
    //   //edgeWrap === false
    //   if (edgeWrapChecked === false) {
    //     this.neighbors[0] = cellMatrix[this.row][this.column + 1];
    //     this.neighbors[1] = cellMatrix[this.row + 1][this.column];
    //     this.neighbors[2] = cellMatrix[this.row + 1][this.column + 1];
    //   }
    //   //edgeWrap === true
    //   else{
    //     this.neighbors[0] = cellMatrix[rowLength][columnLength];
    //     this.neighbors[1] = cellMatrix[rowLength][this.column];
    //     this.neighbors[2] = cellMatrix[rowLength][this.column + 1];
    //     this.neighbors[3] = cellMatrix[this.row][columnLength];
    //     this.neighbors[4] = cellMatrix[this.row][this.column + 1];
    //     this.neighbors[5] = cellMatrix[this.row + 1][columnLength];
    //     this.neighbors[6] = cellMatrix[this.row + 1][this.column];
    //     this.neighbors[7] = cellMatrix[this.row + 1][this.column + 1];
    //   }
    //
    // }
    //
    // setNeighborsCornerTopRight(rowLength, columnLength) {
    //   //edgeWrap === false
    //   if (edgeWrapChecked === false) {
    //     this.neighbors[0] = cellMatrix[this.row][this.column - 1];
    //     this.neighbors[1] = cellMatrix[this.row + 1][this.column - 1];
    //     this.neighbors[2] = cellMatrix[this.row + 1][this.column];
    //   }
    //   //edgeWrap === true
    //   else {
    //     this.neighbors[0] = cellMatrix[rowLength][this.column - 1];
    //     this.neighbors[1] = cellMatrix[rowLength][this.column];
    //     this.neighbors[2] = cellMatrix[rowLength][FIRST_COLUMN];
    //     this.neighbors[3] = cellMatrix[this.row][this.column - 1];
    //     this.neighbors[4] = cellMatrix[this.row][FIRST_COLUMN];
    //     this.neighbors[5] = cellMatrix[this.row + 1][this.column - 1];
    //     this.neighbors[6] = cellMatrix[this.row + 1][this.column];
    //     this.neighbors[7] = cellMatrix[this.row + 1][FIRST_COLUMN];
    //   }
    // }
    //
    //
    // setNeighborsCornerBottomLeft(rowLength, columnLength) {
    //   //edgeWrap === false
    //   if (edgeWrapChecked === false) {
    //     this.neighbors[0] = cellMatrix[this.row - 1][this.column];
    //     this.neighbors[1] = cellMatrix[this.row - 1][this.column + 1];
    //     this.neighbors[2] = cellMatrix[this.row][this.column + 1];
    //   }
    //   //edgeWrap === true
    //   else {
    //     this.neighbors[0] = cellMatrix[this.row - 1][columnLength];
    //     this.neighbors[1] = cellMatrix[this.row - 1][this.column];
    //     this.neighbors[2] = cellMatrix[this.row - 1][this.column + 1];
    //     this.neighbors[3] = cellMatrix[this.row][columnLength];
    //     this.neighbors[4] = cellMatrix[this.row][this.column + 1];
    //     this.neighbors[5] = cellMatrix[FIRST_ROW][columnLength];
    //     this.neighbors[6] = cellMatrix[FIRST_ROW][this.column];
    //     this.neighbors[7] = cellMatrix[FIRST_ROW][this.column + 1];
    //   }
    // }
    //
    //
    // setNeighborsCornerBottomRight() {
    //   //edgeWrap === false
    //   if (edgeWrapChecked === false) {
    //     this.neighbors[0] = cellMatrix[this.row - 1][this.column - 1];
    //     this.neighbors[1] = cellMatrix[this.row - 1][this.column];
    //     this.neighbors[2] = cellMatrix[this.row][this.column - 1];
    //   }
    //   //edgeWrap === true
    //   else {
    //     this.neighbors[0] = cellMatrix[this.row - 1][this.column - 1];
    //     this.neighbors[1] = cellMatrix[this.row - 1][this.column];
    //     this.neighbors[2] = cellMatrix[this.row - 1][FIRST_COLUMN];
    //     this.neighbors[3] = cellMatrix[this.row][this.column - 1];
    //     this.neighbors[4] = cellMatrix[this.row][FIRST_COLUMN];
    //     this.neighbors[5] = cellMatrix[FIRST_ROW][this.column - 1];
    //     this.neighbors[6] = cellMatrix[FIRST_ROW][this.column];
    //     this.neighbors[7] = cellMatrix[FIRST_ROW][FIRST_COLUMN];
    //   }
    // }
    //
    //
    // setNeighborsEdgeTop(rowLength, columnLength) {
    //   //edgeWrap === false
    //   if (edgeWrapChecked === false) {
    //     this.neighbors[0] = cellMatrix[this.row][this.column - 1];
    //     this.neighbors[1] = cellMatrix[this.row][this.column + 1];
    //     this.neighbors[2] = cellMatrix[this.row + 1][this.column - 1];
    //     this.neighbors[3] = cellMatrix[this.row + 1][this.column];
    //     this.neighbors[4] = cellMatrix[this.row + 1][this.column + 1];
    //   }
    //   //edgeWrap === true
    //   else {
    //     this.neighbors[0] = cellMatrix[rowLength][this.column - 1];
    //     this.neighbors[1] = cellMatrix[rowLength][this.column];
    //     this.neighbors[2] = cellMatrix[rowLength][this.column + 1];
    //     this.neighbors[3] = cellMatrix[this.row][this.column - 1];
    //     this.neighbors[4] = cellMatrix[this.row][this.column + 1];
    //     this.neighbors[5] = cellMatrix[this.row + 1][this.column - 1];
    //     this.neighbors[6] = cellMatrix[this.row + 1][this.column];
    //     this.neighbors[7] = cellMatrix[this.row + 1][this.column + 1];
    //   }
    // }
    //
    //
    // setNeighborsEdgeLeft(rowLength, columnLength) {
    //   //edgeWrap === false
    //   if (edgeWrapChecked === false) {
    //     this.neighbors[0] = cellMatrix[this.row - 1][this.column];
    //     this.neighbors[1] = cellMatrix[this.row - 1][this.column + 1];
    //     this.neighbors[2] = cellMatrix[this.row][this.column + 1];
    //     this.neighbors[3] = cellMatrix[this.row + 1][this.column];
    //     this.neighbors[4] = cellMatrix[this.row + 1][this.column + 1];
    //   }
    //   //edgeWrap === true
    //   else {
    //     this.neighbors[0] = cellMatrix[this.row - 1][columnLength];
    //     this.neighbors[1] = cellMatrix[this.row - 1][this.column];
    //     this.neighbors[2] = cellMatrix[this.row - 1][this.column + 1];
    //     this.neighbors[3] = cellMatrix[this.row][columnLength];
    //     this.neighbors[4] = cellMatrix[this.row][this.column + 1];
    //     this.neighbors[5] = cellMatrix[this.row + 1][columnLength];
    //     this.neighbors[6] = cellMatrix[this.row + 1][this.column];
    //     this.neighbors[7] = cellMatrix[this.row + 1][this.column + 1];
    //   }
    // }
    //
    //
    // setNeighborsEdgeRight() {
    //   //edgeWrap === false
    //   if (edgeWrapChecked === false) {
    //     this.neighbors[0] = cellMatrix[this.row - 1][this.column - 1];
    //     this.neighbors[1] = cellMatrix[this.row - 1][this.column];
    //     this.neighbors[2] = cellMatrix[this.row][this.column - 1];
    //     this.neighbors[3] = cellMatrix[this.row + 1][this.column - 1];
    //     this.neighbors[4] = cellMatrix[this.row + 1][this.column];
    //   }
    //   else {
    //   //edgeWrap === true
    //     this.neighbors[0] = cellMatrix[this.row - 1][this.column - 1];
    //     this.neighbors[1] = cellMatrix[this.row - 1][this.column];
    //     this.neighbors[2] = cellMatrix[this.row - 1][FIRST_COLUMN];
    //     this.neighbors[3] = cellMatrix[this.row][this.column - 1];
    //     this.neighbors[4] = cellMatrix[this.row][FIRST_COLUMN];
    //     this.neighbors[5] = cellMatrix[this.row + 1][this.column - 1];
    //     this.neighbors[6] = cellMatrix[this.row + 1][this.column];
    //     this.neighbors[7] = cellMatrix[this.row + 1][FIRST_COLUMN];
    //   }
    // }
    //
    //
    // setNeighborsEdgeBottom() {
    //   //edgeWrap === false
    //   if (edgeWrapChecked === false) {
    //     this.neighbors[0] = cellMatrix[this.row - 1][this.column - 1];
    //     this.neighbors[1] = cellMatrix[this.row - 1][this.column];
    //     this.neighbors[2] = cellMatrix[this.row - 1][this.column + 1];
    //     this.neighbors[3] = cellMatrix[this.row][this.column - 1];
    //     this.neighbors[4] = cellMatrix[this.row][this.column + 1];
    //   }
    //   else {
    //   //edgeWrap === true
    //     this.neighbors[0] = cellMatrix[this.row - 1][this.column - 1];
    //     this.neighbors[1] = cellMatrix[this.row - 1][this.column];
    //     this.neighbors[2] = cellMatrix[this.row - 1][this.column + 1];
    //     this.neighbors[3] = cellMatrix[this.row][this.column - 1];
    //     this.neighbors[4] = cellMatrix[this.row][this.column + 1];
    //     this.neighbors[5] = cellMatrix[FIRST_ROW][this.column - 1];
    //     this.neighbors[6] = cellMatrix[FIRST_ROW][this.column];
    //     this.neighbors[7] = cellMatrix[FIRST_ROW][this.column + 1];
    //   }
    // }
    //
    //
    // setNeighborsInterior() {
    //   this.neighbors[0] = cellMatrix[this.row - 1][this.column - 1];
    //   this.neighbors[1] = cellMatrix[this.row - 1][this.column];
    //   this.neighbors[2] = cellMatrix[this.row - 1][this.column + 1];
    //   this.neighbors[3] = cellMatrix[this.row][this.column - 1];
    //   this.neighbors[4] = cellMatrix[this.row][this.column + 1];
    //   this.neighbors[5] = cellMatrix[this.row + 1][this.column - 1];
    //   this.neighbors[6] = cellMatrix[this.row + 1][this.column];
    //   this.neighbors[7] = cellMatrix[this.row + 1][this.column + 1];
    // }

    //this is probably abstract enough to stay in the Cell class
    setNeighbors(neighborhoodType) {
      var rowLength = cellMatrix.length - 1;
      var columnLength = cellMatrix[this.row].length - 1;

      switch (neighborhoodType) {
        case "moore":
          //set top left corner
          if (this.row === 1 && this.column === 1) {
            NeighborHoodMoore.setNeighborsCornerTopLeft(this, rowLength, columnLength);
          }
          //set top edge
          else if (this.row === 1 && this.column < (columnLength)) {
            NeighborHoodMoore.setNeighborsEdgeTop(this, rowLength, columnLength);
          }
          //set top right corner
          else if (this.row === 1 && this.column === (columnLength)) {
            NeighborHoodMoore.setNeighborsCornerTopRight(this, rowLength, columnLength);
          }
          //set left edge
          else if (this.row < (rowLength) && this.column === 1) {
            NeighborHoodMoore.setNeighborsEdgeLeft(this, rowLength, columnLength);
          }
          //set right edge
          else if (this.row < (rowLength) && this.column === (columnLength)) {
            NeighborHoodMoore.setNeighborsEdgeRight(this, rowLength, columnLength);
          }
          //set bottom left corner
          else if (this.row === (rowLength) && this.column === 1) {
            NeighborHoodMoore.setNeighborsCornerBottomLeft(this, rowLength, columnLength);
          }
          //set bottom edge
          else if (this.row === (rowLength) && this.column < (columnLength)) {
            NeighborHoodMoore.setNeighborsEdgeBottom(this);
          }
          //set bottom right corner
          else if (this.row === (rowLength) && this.column === (columnLength)) {
            NeighborHoodMoore.setNeighborsCornerBottomRight(this);
          }
          //set everything else
          else {
            NeighborHoodMoore.setNeighborsInterior(this);
          }
          break;

        default:
          alert("There is no such neighborhood type known to medical science!");
          break;
      }
    }

    //this can stay in the Cell class
    toggleCellColor() {
      if (this != null) {
        if (this.style.backgroundColor === "white") {
          this.style.backgroundColor = "black";
          cellMatrix[this.dataset.row][this.dataset.column].backgroundColor = "black";
        }
        else {
          this.style.backgroundColor = "white";
          cellMatrix[this.dataset.row][this.dataset.column].backgroundColor = "white";
        }
      }
      else {
        this.style.backgroundColor = defaultBackgroundColor;
        cellMatrix[this.dataset.row][this.dataset.column].backgroundColor = defaultBackgroundColor;
        this.toggleCellColor();
      }
    }

    //this can stay in the Cell class
    toggleAliveOrDead() {
      if (this.dataset.isalive === "false") {
        this.dataset.isalive = "true";
        cellMatrix[this.dataset.row][this.dataset.column].isAlive = "true";
      }
      else {
        this.dataset.isalive = "false";
        cellMatrix[this.dataset.row][this.dataset.column].isAlive = "false";
      }
    }
  }


  class NeighborHoodMoore {
    //these neighbor functions are all Game of Life (well, any module that uses the Moore neighborhood) specific and can be extracted
    //from the Cell class
    static setNeighborsCornerTopLeft(cell, rowLength, columnLength) {
      //edgeWrap === false
      if (edgeWrapChecked === false) {
        cell.neighbors[0] = cellMatrix[cell.row][cell.column + 1];
        cell.neighbors[1] = cellMatrix[cell.row + 1][cell.column];
        cell.neighbors[2] = cellMatrix[cell.row + 1][cell.column + 1];
      }
      //edgeWrap === true
      else{
        cell.neighbors[0] = cellMatrix[rowLength][columnLength];
        cell.neighbors[1] = cellMatrix[rowLength][cell.column];
        cell.neighbors[2] = cellMatrix[rowLength][cell.column + 1];
        cell.neighbors[3] = cellMatrix[cell.row][columnLength];
        cell.neighbors[4] = cellMatrix[cell.row][cell.column + 1];
        cell.neighbors[5] = cellMatrix[cell.row + 1][columnLength];
        cell.neighbors[6] = cellMatrix[cell.row + 1][cell.column];
        cell.neighbors[7] = cellMatrix[cell.row + 1][cell.column + 1];
      }
    }

    static setNeighborsCornerTopRight(cell, rowLength, columnLength) {
      //edgeWrap === false
      if (edgeWrapChecked === false) {
        cell.neighbors[0] = cellMatrix[cell.row][cell.column - 1];
        cell.neighbors[1] = cellMatrix[cell.row + 1][cell.column - 1];
        cell.neighbors[2] = cellMatrix[cell.row + 1][cell.column];
      }
      //edgeWrap === true
      else {
        cell.neighbors[0] = cellMatrix[rowLength][cell.column - 1];
        cell.neighbors[1] = cellMatrix[rowLength][cell.column];
        cell.neighbors[2] = cellMatrix[rowLength][FIRST_COLUMN];
        cell.neighbors[3] = cellMatrix[cell.row][cell.column - 1];
        cell.neighbors[4] = cellMatrix[cell.row][FIRST_COLUMN];
        cell.neighbors[5] = cellMatrix[cell.row + 1][cell.column - 1];
        cell.neighbors[6] = cellMatrix[cell.row + 1][cell.column];
        cell.neighbors[7] = cellMatrix[cell.row + 1][FIRST_COLUMN];
      }
    }


    static setNeighborsCornerBottomLeft(cell, rowLength, columnLength) {
      //edgeWrap === false
      if (edgeWrapChecked === false) {
        cell.neighbors[0] = cellMatrix[cell.row - 1][cell.column];
        cell.neighbors[1] = cellMatrix[cell.row - 1][cell.column + 1];
        cell.neighbors[2] = cellMatrix[cell.row][cell.column + 1];
      }
      //edgeWrap === true
      else {
        cell.neighbors[0] = cellMatrix[cell.row - 1][columnLength];
        cell.neighbors[1] = cellMatrix[cell.row - 1][cell.column];
        cell.neighbors[2] = cellMatrix[cell.row - 1][cell.column + 1];
        cell.neighbors[3] = cellMatrix[cell.row][columnLength];
        cell.neighbors[4] = cellMatrix[cell.row][cell.column + 1];
        cell.neighbors[5] = cellMatrix[FIRST_ROW][columnLength];
        cell.neighbors[6] = cellMatrix[FIRST_ROW][cell.column];
        cell.neighbors[7] = cellMatrix[FIRST_ROW][cell.column + 1];
      }
    }


    static setNeighborsCornerBottomRight(cell) {
      //edgeWrap === false
      if (edgeWrapChecked === false) {
        cell.neighbors[0] = cellMatrix[cell.row - 1][cell.column - 1];
        cell.neighbors[1] = cellMatrix[cell.row - 1][cell.column];
        cell.neighbors[2] = cellMatrix[cell.row][cell.column - 1];
      }
      //edgeWrap === true
      else {
        cell.neighbors[0] = cellMatrix[cell.row - 1][cell.column - 1];
        cell.neighbors[1] = cellMatrix[cell.row - 1][cell.column];
        cell.neighbors[2] = cellMatrix[cell.row - 1][FIRST_COLUMN];
        cell.neighbors[3] = cellMatrix[cell.row][cell.column - 1];
        cell.neighbors[4] = cellMatrix[cell.row][FIRST_COLUMN];
        cell.neighbors[5] = cellMatrix[FIRST_ROW][cell.column - 1];
        cell.neighbors[6] = cellMatrix[FIRST_ROW][cell.column];
        cell.neighbors[7] = cellMatrix[FIRST_ROW][FIRST_COLUMN];
      }
    }


    static setNeighborsEdgeTop(cell, rowLength, columnLength) {
      //edgeWrap === false
      if (edgeWrapChecked === false) {
        cell.neighbors[0] = cellMatrix[cell.row][cell.column - 1];
        cell.neighbors[1] = cellMatrix[cell.row][cell.column + 1];
        cell.neighbors[2] = cellMatrix[cell.row + 1][cell.column - 1];
        cell.neighbors[3] = cellMatrix[cell.row + 1][cell.column];
        cell.neighbors[4] = cellMatrix[cell.row + 1][cell.column + 1];
      }
      //edgeWrap === true
      else {
        cell.neighbors[0] = cellMatrix[rowLength][cell.column - 1];
        cell.neighbors[1] = cellMatrix[rowLength][cell.column];
        cell.neighbors[2] = cellMatrix[rowLength][cell.column + 1];
        cell.neighbors[3] = cellMatrix[cell.row][cell.column - 1];
        cell.neighbors[4] = cellMatrix[cell.row][cell.column + 1];
        cell.neighbors[5] = cellMatrix[cell.row + 1][cell.column - 1];
        cell.neighbors[6] = cellMatrix[cell.row + 1][cell.column];
        cell.neighbors[7] = cellMatrix[cell.row + 1][cell.column + 1];
      }
    }


    static setNeighborsEdgeLeft(cell, rowLength, columnLength) {
      //edgeWrap === false
      if (edgeWrapChecked === false) {
        cell.neighbors[0] = cellMatrix[cell.row - 1][cell.column];
        cell.neighbors[1] = cellMatrix[cell.row - 1][cell.column + 1];
        cell.neighbors[2] = cellMatrix[cell.row][cell.column + 1];
        cell.neighbors[3] = cellMatrix[cell.row + 1][cell.column];
        cell.neighbors[4] = cellMatrix[cell.row + 1][cell.column + 1];
      }
      //edgeWrap === true
      else {
        cell.neighbors[0] = cellMatrix[cell.row - 1][columnLength];
        cell.neighbors[1] = cellMatrix[cell.row - 1][cell.column];
        cell.neighbors[2] = cellMatrix[cell.row - 1][cell.column + 1];
        cell.neighbors[3] = cellMatrix[cell.row][columnLength];
        cell.neighbors[4] = cellMatrix[cell.row][cell.column + 1];
        cell.neighbors[5] = cellMatrix[cell.row + 1][columnLength];
        cell.neighbors[6] = cellMatrix[cell.row + 1][cell.column];
        cell.neighbors[7] = cellMatrix[cell.row + 1][cell.column + 1];
      }
    }


    static setNeighborsEdgeRight(cell) {
      //edgeWrap === false
      if (edgeWrapChecked === false) {
        cell.neighbors[0] = cellMatrix[cell.row - 1][cell.column - 1];
        cell.neighbors[1] = cellMatrix[cell.row - 1][cell.column];
        cell.neighbors[2] = cellMatrix[cell.row][cell.column - 1];
        cell.neighbors[3] = cellMatrix[cell.row + 1][cell.column - 1];
        cell.neighbors[4] = cellMatrix[cell.row + 1][cell.column];
      }
      else {
      //edgeWrap === true
        cell.neighbors[0] = cellMatrix[cell.row - 1][cell.column - 1];
        cell.neighbors[1] = cellMatrix[cell.row - 1][cell.column];
        cell.neighbors[2] = cellMatrix[cell.row - 1][FIRST_COLUMN];
        cell.neighbors[3] = cellMatrix[cell.row][cell.column - 1];
        cell.neighbors[4] = cellMatrix[cell.row][FIRST_COLUMN];
        cell.neighbors[5] = cellMatrix[cell.row + 1][cell.column - 1];
        cell.neighbors[6] = cellMatrix[cell.row + 1][cell.column];
        cell.neighbors[7] = cellMatrix[cell.row + 1][FIRST_COLUMN];
      }
    }


    static setNeighborsEdgeBottom(cell) {
      //edgeWrap === false
      if (edgeWrapChecked === false) {
        cell.neighbors[0] = cellMatrix[cell.row - 1][cell.column - 1];
        cell.neighbors[1] = cellMatrix[cell.row - 1][cell.column];
        cell.neighbors[2] = cellMatrix[cell.row - 1][cell.column + 1];
        cell.neighbors[3] = cellMatrix[cell.row][cell.column - 1];
        cell.neighbors[4] = cellMatrix[cell.row][cell.column + 1];
      }
      else {
      //edgeWrap === true
        cell.neighbors[0] = cellMatrix[cell.row - 1][cell.column - 1];
        cell.neighbors[1] = cellMatrix[cell.row - 1][cell.column];
        cell.neighbors[2] = cellMatrix[cell.row - 1][cell.column + 1];
        cell.neighbors[3] = cellMatrix[cell.row][cell.column - 1];
        cell.neighbors[4] = cellMatrix[cell.row][cell.column + 1];
        cell.neighbors[5] = cellMatrix[FIRST_ROW][cell.column - 1];
        cell.neighbors[6] = cellMatrix[FIRST_ROW][cell.column];
        cell.neighbors[7] = cellMatrix[FIRST_ROW][cell.column + 1];
      }
    }


    static setNeighborsInterior(cell) {
      cell.neighbors[0] = cellMatrix[cell.row - 1][cell.column - 1];
      cell.neighbors[1] = cellMatrix[cell.row - 1][cell.column];
      cell.neighbors[2] = cellMatrix[cell.row - 1][cell.column + 1];
      cell.neighbors[3] = cellMatrix[cell.row][cell.column - 1];
      cell.neighbors[4] = cellMatrix[cell.row][cell.column + 1];
      cell.neighbors[5] = cellMatrix[cell.row + 1][cell.column - 1];
      cell.neighbors[6] = cellMatrix[cell.row + 1][cell.column];
      cell.neighbors[7] = cellMatrix[cell.row + 1][cell.column + 1];
    }
  }



  var setNextGeneration = function() {
    var numberOfCells = ((cellMatrix.length - 1) * (cellMatrix[1].length - 1));
    var rowCount = cellMatrix.length - 1;
    var columnCount = cellMatrix[1].length - 1;

    //loop through the rows
    for (var i = 1; i <= rowCount; i++) {
      tempMatrix[i] = [];

      //loop through the cells in the row
      setNextGenerationCellRows(i, columnCount);
    }

    numberOfGenerations++;
    transferCellData(tempMatrix, cellMatrix);    //transfer the next generation cells into the main matrix object
    killAllCells(tempMatrix);                    //reset the tempMatrix object to its initial blank state
    updateMatrixDisplay();                       //update the html elements for the display
    updateCellGraphData();
  }


  var updateCellGraphData = function() {
    generationData.push(numberOfGenerations);    //I don't think we need this because numberOfGenerations is essentially static.
    liveCellData.push(numberOfLiveCells);
    //cellPopulationData.push({"generation" : numberOfGenerations, "liveCells" : numberOfLiveCells});
  }


  var setGraphDataObject = function() {
    var jsonString = "{";
    var tempString = "";
    for (var i = 0; i < (generationData.length); i++) {
    //   tempString = '"generation" : ' + i + ', "liveCells" : ' + liveCellData[i] + ',';
    //   jsonString = jsonString.concat(tempString);

      cellPopulationData.push({generation: i, liveCells: liveCellData[i]});
     }

     numberOfLiveCellsMax = liveCellData.reduce(function(a, b) {
       return Math.max(a, b);
     });

    // tempString = '"generation" : ' + numberOfGenerations + ', "liveCells" : ' + liveCellData[numberOfGenerations - 1] + '}';
    // jsonString = jsonString.concat(tempString);

    //jsonString.concat('{"generation" : ' + numberOfGenerations + ', "liveCells"' + numberOfLiveCells + '}');

    //cellPopulationData = JSON.parse(jsonString);

    //cellPopulationData.push({"generation" : i, "liveCells" : numberOfLiveCells}",");
  }


  var createLineGraph = function() {
    var xScale = d3.scaleLinear()
      .domain([0, numberOfGenerations])
      .range([0, width]);

    var yScale = d3.scaleLinear()
      .domain([0, numberOfLiveCellsMax])
      .range([height, 0]);
  }


  var setNextGenerationCellRows = function(row, columnCount) {
    for (var j = 1; j <= columnCount; j++) {
      var tempCellID;

      tempCellID = cellMatrix[row][j].ID;
      tempMatrix[row][j] = new Cell(tempCellID, row, j, false, [], defaultBackgroundColor);

      //loop through each live cell's neighbors
      //determine whether this cell will be alive in the next generation
      setNextGenerationCellAliveOrDead(row, j);
    }
  }


  var setNextGenerationCellAliveOrDead = function(row, column) {
    var neighborCount = cellMatrix[row][column].neighbors.length;
    //var liveNeighborCount = 0;

    if (cellMatrix[row][column].isAlive === "true") {
      setNeighborCountLive(row, column, neighborCount);
      //liveNeighborCount = this.getNeighborCountLive(row, column, neighborCount);
    }
    //loop through each dead cell's neighbors
    else {
      setNeighborCountDead(row, column, neighborCount);
      //liveNeighborCount = this.getNeighborCountDead(row, j, neighborCount);
    }
  }


  var setNeighborCountLive = function(row, column, neighborCount) {
    var _liveNeighborCount = 0;

    for (var k = 0; k < neighborCount; k++) {
      if (cellMatrix[row][column].neighbors[k].isAlive === "true") {    //probably have to go through the divs rather than the cellMatrix
        _liveNeighborCount++;
      }
    }

    if (_liveNeighborCount < 2) {
      tempMatrix[row][column].isAlive = "false";
      tempMatrix[row][column].backgroundColor = "white";
    }
    else if (_liveNeighborCount > 3) {
      tempMatrix[row][column].isAlive = "false";
      tempMatrix[row][column].backgroundColor = "white";
    }
    else {
      tempMatrix[row][column].isAlive = "true";
      tempMatrix[row][column].backgroundColor = "black";
    }

    return _liveNeighborCount;
  }


  var setNeighborCountDead = function(row, column, neighborCount) {
    var _liveNeighborCount = 0;

    for (var k = 0; k < neighborCount; k++) {
      if (cellMatrix[row][column].neighbors[k].isAlive === "true") {
        _liveNeighborCount++;
      }
    }

    if (_liveNeighborCount === 3) {
      tempMatrix[row][column].isAlive = "true";
      tempMatrix[row][column].backgroundColor = "black";
    }
  }


  var transferCellData = function(matrixSource, matrixDestination) {
    var rowCount = matrixSource.length - 1;
    var columnCount = matrixSource.length - 1;

    for (var i = 1; i <= rowCount; i++) {
      for (var j = 1; j <= columnCount; j++) {
        matrixDestination[i][j].isAlive = matrixSource[i][j].isAlive;
        matrixDestination[i][j].backgroundColor = matrixSource[i][j].backgroundColor;
      }
    }
  }


  var killAllCells = function(matrix) {
    var rowCount = matrix.length - 1;
    var columnCount = matrix.length - 1;

    for (var i = 1; i <= rowCount; i++) {
      for (var j = 1; j <= columnCount; j++) {
        matrix[i][j].isAlive = "false";
        matrix[i][j].backgroundColor = defaultBackgroundColor;
      }
    }
  }


  var updateMatrixDisplay = function() {
    var cells = document.getElementsByClassName("cell");
    var numberOfCells = cells.length;

    for(var i = 0; i < numberOfCells; i++)
    {
       cells.item(i).dataset.isalive = cellMatrix[cells.item(i).dataset.row][cells.item(i).dataset.column].isAlive;
       cells.item(i).style.backgroundColor = cellMatrix[cells.item(i).dataset.row][cells.item(i).dataset.column].backgroundColor;
    }

    document.getElementById("numberOfGenerations").innerHTML = numberOfGenerations;
    updateLiveCellCount();
  }


  var updateLiveCellCount = function() {
    var cells = document.getElementsByClassName("cell");
    var numberOfCells = cells.length;
    //var numberOfLiveCells = 0;
    numberOfLiveCells = 0;

    for(var i = 0; i < numberOfCells; i++)
    {
       if (cells.item(i).dataset.isalive === "true") {
         numberOfLiveCells++;
       }
    }

    document.getElementById("numberOfLiveCells").innerHTML = numberOfLiveCells;
  }

  var demo = function() {
    document.getElementById("edgeWrapCheck").checked = true;
    getPatternSeedRPentomino(DIMENSION_R_PENTOMINO);
    //edgeWrapChecked = true;
    scale("1px");
    rate(10);
    start();
  }


  var newSeed = function(dimension) {
    //if there's already a grid, we need to get rid of it before we make the new one
    if (Object.keys(grid).length != 0 && grid.constructor != Object) {
      removeGrid();
    }

    edgeWrapChecked = document.getElementById("edgeWrapCheck").checked;

    grid = new Grid(dimension, "moore");
    grid.initGrid(dimension);
  }

  //changes the size of the cells in the grid
  var scale = function(cellSize) {
    //alert("This feature is not yet available.");
    var cells = document.getElementsByClassName("cell");
    var numberOfElements = cells.length;

    for (var i = 0; i < numberOfElements; i++)
    {
      cells.item(i).style.padding = cellSize;
    }
  }

  //bases the rate of generations generated on user input; how quickly the generations appear and change on the screen
  var rate = function(milliseconds) {
    rateMS = milliseconds;
  }

  //step through one generation at a time
  var step = function() {
    setNextGeneration();
  }

  //starts game of life
  var start = function() {
    grid.initGenesisGrid();
    intervalID = setInterval(setNextGeneration, rateMS);
  }


  //Probably don't need this. Stop / Start works the same way Pause / Resume would.
  var pause = function() {
    alert("This feature is not yet available.");
  }


//Probably don't need this. Stop / Start works the same way Pause / Resume would.
  var resume = function() {
    alert("This feature is not yet available.");
  }


  var stop = function() {
    clearInterval(intervalID);
    setGraphDataObject();
  }

  var refresh = function() {
    location.reload(true);
  }

  //displays neighbors of a single clicked cell
  var showCellNeighbors = function() {
    var cells = document.getElementsByClassName("cell");
    var numberOfCells = cells.length;
    var numberOfClickedCells = 0;
    var neighborCount = 0;
    var cellID;
    var i = 0;

    for (var i = 0; i < numberOfCells; i++) {
      if (cells.item(i).style.backgroundColor != defaultBackgroundColor) {
        cellID = cells.item(i).id;
        numberOfClickedCells++;
      }
    }

    if (numberOfClickedCells > 1) {
      alert("Please click only one cell.");
    }
    else {
      var row = document.getElementById(cellID).dataset.row;
      var column = document.getElementById(cellID).dataset.column;

      neighborCount = cellMatrix[row][column].neighbors.length;

      for (var i = 0; i < neighborCount; i++) {
        var tempID = "cell" + cellMatrix[row][column].neighbors[i].ID;
        document.getElementById(tempID).style.backgroundColor = "black";
        document.getElementById(tempID).dataset.isalive = "true";
      }

      updateLiveCellCount();
    }
  }

  //resets to the original starting grid selected by user
  var reset = function() {
    numberOfGenerations = 0;
    transferCellData(genesisMatrix, cellMatrix);
    updateMatrixDisplay();
  }

  //clean slate with same dimension
  var clearGrid = function() {
      var cells = document.getElementsByClassName("cell");
      var numberOfCells = cells.length;

      //need to clear the cellMatrix object too
      for(var i = 0; i < numberOfCells; i++)
      {
         cells.item(i).style.backgroundColor = defaultBackgroundColor;
         cells.item(i).dataset.isalive = "false";
         cellMatrix[cells.item(i).dataset.row][cells.item(i).dataset.column].backgroundColor = defaultBackgroundColor;
         cellMatrix[cells.item(i).dataset.row][cells.item(i).dataset.column].isAlive = "false";
      }

      document.getElementById("numberOfLiveCells").innerHTML = 0;
      document.getElementById("numberOfGenerations").innerHTML = 0;
      numberOfGenerations = 0;
  }

  //when New Seed button is clicked the old must be removed before the new grid can be made
  var removeGrid = function() {
      var theBody = document.body;
      var theGrid = document.getElementById("theGrid");
      var rows = document.getElementsByClassName("row");
      var numberOfRows = rows.length;

      theBody.removeChild(theGrid);
      resetDisplayCounts();
  }


  var resetDisplayCounts = function() {
    document.getElementById("numberOfLiveCells").innerHTML = 0;
    document.getElementById("numberOfGenerations").innerHTML = 0;
  }


  var save = function() {
    alert("This feature is not yet available.");
  }


  var getPatternSeedStillLife = function(pattern) {
    switch(pattern) {
      case "block":
        getPatternSeedBlock(DIMENSION_BLOCK);
        break;
      case "beehive":
        getPatternSeedBeehive(DIMENSION_BEEHIVE);
        break;
      case "loaf":
        getPatternSeedLoaf(DIMENSION_LOAF);
        break;
      case "boat":
        getPatternSeedBoat(DIMENSION_BOAT);
        break;
      case "tub":
        getPatternSeedTub(DIMENSION_TUB);
        break;
      default:
        alert("There is no such pattern known to medical science!");
        break;
    }
  }


  var getPatternSeedOscillators = function(pattern) {
    switch(pattern) {
      case "blinker":
        getPatternSeedBlinker(DIMENSION_BLINKER);
        break;
      case "toad":
        getPatternSeedToad(DIMENSION_TOAD);
        break;
      case "beacon":
        getPatternSeedBeacon(DIMENSION_BEACON);
        break;
      case "pulsar":
        getPatternSeedPulsar(DIMENSION_PULSAR);
        break;
      case "pentadecathlon":
        getPatternSeedPentadecathlon(DIMENSION_PENTADECATHLON);
        break;
      default:
        alert("There is no such pattern known to medical science!");
        break;
    }
  }


  var getPatternSeedSpaceships = function(pattern) {
    switch(pattern) {
      case "glider":
        getPatternSeedGlider(DIMENSION_GLIDER);
        break;
      case "lightweightSpaceship":
        getPatternSeedLightweightSpaceship(DIMENSION_LWSS);
        break;
      case "middleweightSpaceship":
        getPatternSeedMiddleweightSpaceship(DIMENSION_MWSS);
        break;
      case "heavyweightSpaceship":
        getPatternSeedHeavyweightSpaceship(DIMENSION_HWSS);
        break;
      case "pentadecathlon":
        getPatternSeedPentadecathlon(DIMENSION_PENTADECATHLON);
        break;
      default:
        alert("There is no such pattern known to medical science!");
        break;
    }
  }


  var getPatternSeedMethuselahs = function(pattern) {
    switch(pattern) {
      case "rPentomino":
        getPatternSeedRPentomino(DIMENSION_R_PENTOMINO);
        break;
      case "diehard":
        getPatternSeedDiehard(DIMENSION_DIEHARD);
        break;
      case "acorn":
        getPatternSeedAcorn(DIMENSION_ACORN);
        break;
      default:
        alert("There is no such pattern known to medical science!");
        break;
    }
  }


  var getPatternSeedInfinite = function(pattern) {
    switch(pattern) {
      case "gosperGliderGun":
        getPatternSeedGosperGliderGun(DIMENSION_GOSPER_GLIDER_GUN);
        break;
      default:
        alert("There is no such pattern known to medical science!");
        break;
    }
  }



  var getPatternSeedBlock = function(dimension) {
    newSeed(dimension);

    cellMatrix[2][2].isAlive = "true";
    cellMatrix[2][2].backgroundColor = "black";
    cellMatrix[2][3].isAlive = "true";
    cellMatrix[2][3].backgroundColor = "black";
    cellMatrix[3][2].isAlive = "true";
    cellMatrix[3][2].backgroundColor = "black";
    cellMatrix[3][3].isAlive = "true";
    cellMatrix[3][3].backgroundColor = "black";

    updateMatrixDisplay();
  }


  var getPatternSeedBeehive = function(dimension){
    newSeed(dimension);

    cellMatrix[2][3].isAlive = "true";
    cellMatrix[2][3].backgroundColor = "black";
    cellMatrix[2][4].isAlive = "true";
    cellMatrix[2][4].backgroundColor = "black";
    cellMatrix[3][2].isAlive = "true";
    cellMatrix[3][2].backgroundColor = "black";
    cellMatrix[3][5].isAlive = "true";
    cellMatrix[3][5].backgroundColor = "black";
    cellMatrix[4][3].isAlive = "true";
    cellMatrix[4][3].backgroundColor = "black";
    cellMatrix[4][4].isAlive = "true";
    cellMatrix[4][4].backgroundColor = "black";

    updateMatrixDisplay();
  }


  var getPatternSeedLoaf = function(dimension) {
    newSeed(dimension);

    cellMatrix[2][3].isAlive = "true";
    cellMatrix[2][3].backgroundColor = "black";
    cellMatrix[2][4].isAlive = "true";
    cellMatrix[2][4].backgroundColor = "black";
    cellMatrix[3][2].isAlive = "true";
    cellMatrix[3][2].backgroundColor = "black";
    cellMatrix[3][5].isAlive = "true";
    cellMatrix[3][5].backgroundColor = "black";
    cellMatrix[4][3].isAlive = "true";
    cellMatrix[4][3].backgroundColor = "black";
    cellMatrix[4][5].isAlive = "true";
    cellMatrix[4][5].backgroundColor = "black";
    cellMatrix[5][4].isAlive = "true";
    cellMatrix[5][4].backgroundColor = "black";

    updateMatrixDisplay();
  }


  var getPatternSeedBoat = function(dimension) {
    newSeed(dimension);

    cellMatrix[2][2].isAlive = "true";
    cellMatrix[2][2].backgroundColor = "black";
    cellMatrix[2][3].isAlive = "true";
    cellMatrix[2][3].backgroundColor = "black";
    cellMatrix[3][2].isAlive = "true";
    cellMatrix[3][2].backgroundColor = "black";
    cellMatrix[3][4].isAlive = "true";
    cellMatrix[3][4].backgroundColor = "black";
    cellMatrix[4][3].isAlive = "true";
    cellMatrix[4][3].backgroundColor = "black";

    updateMatrixDisplay();
  }


  var getPatternSeedTub = function(dimension) {
    newSeed(dimension);

    cellMatrix[2][3].isAlive = "true";
    cellMatrix[2][3].backgroundColor = "black";
    cellMatrix[3][2].isAlive = "true";
    cellMatrix[3][2].backgroundColor = "black";
    cellMatrix[3][4].isAlive = "true";
    cellMatrix[3][4].backgroundColor = "black";
    cellMatrix[4][3].isAlive = "true";
    cellMatrix[4][3].backgroundColor = "black";

    updateMatrixDisplay();
  }


  var getPatternSeedBlinker = function(dimension) {
    newSeed(dimension);

    cellMatrix[3][2].isAlive = "true";
    cellMatrix[3][2].backgroundColor = "black";
    cellMatrix[3][3].isAlive = "true";
    cellMatrix[3][3].backgroundColor = "black";
    cellMatrix[3][4].isAlive = "true";
    cellMatrix[3][4].backgroundColor = "black";

    updateMatrixDisplay();
  }


  var getPatternSeedToad = function(dimension) {
    newSeed(dimension);

    cellMatrix[3][3].isAlive = "true";
    cellMatrix[3][3].backgroundColor = "black";
    cellMatrix[3][4].isAlive = "true";
    cellMatrix[3][4].backgroundColor = "black";
    cellMatrix[3][5].isAlive = "true";
    cellMatrix[3][5].backgroundColor = "black";
    cellMatrix[4][2].isAlive = "true";
    cellMatrix[4][2].backgroundColor = "black";
    cellMatrix[4][3].isAlive = "true";
    cellMatrix[4][3].backgroundColor = "black";
    cellMatrix[4][4].isAlive = "true";
    cellMatrix[4][4].backgroundColor = "black";

    updateMatrixDisplay();
  }


  var getPatternSeedBeacon = function(dimension) {
    newSeed(dimension);

    cellMatrix[2][2].isAlive = "true";
    cellMatrix[2][2].backgroundColor = "black";
    cellMatrix[2][3].isAlive = "true";
    cellMatrix[2][3].backgroundColor = "black";
    cellMatrix[3][2].isAlive = "true";
    cellMatrix[3][2].backgroundColor = "black";
    cellMatrix[4][5].isAlive = "true";
    cellMatrix[4][5].backgroundColor = "black";
    cellMatrix[5][4].isAlive = "true";
    cellMatrix[5][4].backgroundColor = "black";
    cellMatrix[5][5].isAlive = "true";
    cellMatrix[5][5].backgroundColor = "black";

    updateMatrixDisplay();
  }

  var getPatternSeedPulsar = function(dimension) {
    newSeed(dimension);

    cellMatrix[3][5].isAlive = "true";
    cellMatrix[3][5].backgroundColor = "black";
    cellMatrix[3][6].isAlive = "true";
    cellMatrix[3][6].backgroundColor = "black";
    cellMatrix[3][7].isAlive = "true";
    cellMatrix[3][7].backgroundColor = "black";
    cellMatrix[3][11].isAlive = "true";
    cellMatrix[3][11].backgroundColor = "black";
    cellMatrix[3][12].isAlive = "true";
    cellMatrix[3][12].backgroundColor = "black";
    cellMatrix[3][13].isAlive = "true";
    cellMatrix[3][13].backgroundColor = "black";
    cellMatrix[5][3].isAlive = "true";
    cellMatrix[5][3].backgroundColor = "black";
    cellMatrix[5][8].isAlive = "true";
    cellMatrix[5][8].backgroundColor = "black";
    cellMatrix[5][10].isAlive = "true";
    cellMatrix[5][10].backgroundColor = "black";
    cellMatrix[5][15].isAlive = "true";
    cellMatrix[5][15].backgroundColor = "black";
    cellMatrix[6][3].isAlive = "true";
    cellMatrix[6][3].backgroundColor = "black";
    cellMatrix[6][8].isAlive = "true";
    cellMatrix[6][8].backgroundColor = "black";
    cellMatrix[6][10].isAlive = "true";
    cellMatrix[6][10].backgroundColor = "black";
    cellMatrix[6][15].isAlive = "true";
    cellMatrix[6][15].backgroundColor = "black";
    cellMatrix[7][3].isAlive = "true";
    cellMatrix[7][3].backgroundColor = "black";
    cellMatrix[7][8].isAlive = "true";
    cellMatrix[7][8].backgroundColor = "black";
    cellMatrix[7][10].isAlive = "true";
    cellMatrix[7][10].backgroundColor = "black";
    cellMatrix[7][15].isAlive = "true";
    cellMatrix[7][15].backgroundColor = "black";
    cellMatrix[8][5].isAlive = "true";
    cellMatrix[8][5].backgroundColor = "black";
    cellMatrix[8][6].isAlive = "true";
    cellMatrix[8][6].backgroundColor = "black";
    cellMatrix[8][7].isAlive = "true";
    cellMatrix[8][7].backgroundColor = "black";
    cellMatrix[8][11].isAlive = "true";
    cellMatrix[8][11].backgroundColor = "black";
    cellMatrix[8][12].isAlive = "true";
    cellMatrix[8][12].backgroundColor = "black";
    cellMatrix[8][13].isAlive = "true";
    cellMatrix[8][13].backgroundColor = "black";
    cellMatrix[10][5].isAlive = "true";
    cellMatrix[10][5].backgroundColor = "black";
    cellMatrix[10][6].isAlive = "true";
    cellMatrix[10][6].backgroundColor = "black";
    cellMatrix[10][7].isAlive = "true";
    cellMatrix[10][7].backgroundColor = "black";
    cellMatrix[10][11].isAlive = "true";
    cellMatrix[10][11].backgroundColor = "black";
    cellMatrix[10][12].isAlive = "true";
    cellMatrix[10][12].backgroundColor = "black";
    cellMatrix[10][13].isAlive = "true";
    cellMatrix[10][13].backgroundColor = "black";
    cellMatrix[11][3].isAlive = "true";
    cellMatrix[11][3].backgroundColor = "black";
    cellMatrix[11][8].isAlive = "true";
    cellMatrix[11][8].backgroundColor = "black";
    cellMatrix[11][10].isAlive = "true";
    cellMatrix[11][10].backgroundColor = "black";
    cellMatrix[11][15].isAlive = "true";
    cellMatrix[11][15].backgroundColor = "black";
    cellMatrix[12][3].isAlive = "true";
    cellMatrix[12][3].backgroundColor = "black";
    cellMatrix[12][8].isAlive = "true";
    cellMatrix[12][8].backgroundColor = "black";
    cellMatrix[12][10].isAlive = "true";
    cellMatrix[12][10].backgroundColor = "black";
    cellMatrix[12][15].isAlive = "true";
    cellMatrix[12][15].backgroundColor = "black";
    cellMatrix[13][3].isAlive = "true";
    cellMatrix[13][3].backgroundColor = "black";
    cellMatrix[13][8].isAlive = "true";
    cellMatrix[13][8].backgroundColor = "black";
    cellMatrix[13][10].isAlive = "true";
    cellMatrix[13][10].backgroundColor = "black";
    cellMatrix[13][15].isAlive = "true";
    cellMatrix[13][15].backgroundColor = "black";
    cellMatrix[15][5].isAlive = "true";
    cellMatrix[15][5].backgroundColor = "black";
    cellMatrix[15][6].isAlive = "true";
    cellMatrix[15][6].backgroundColor = "black";
    cellMatrix[15][7].isAlive = "true";
    cellMatrix[15][7].backgroundColor = "black";
    cellMatrix[15][11].isAlive = "true";
    cellMatrix[15][11].backgroundColor = "black";
    cellMatrix[15][12].isAlive = "true";
    cellMatrix[15][12].backgroundColor = "black";
    cellMatrix[15][13].isAlive = "true";
    cellMatrix[15][13].backgroundColor = "black";

    updateMatrixDisplay();
  }


  var getPatternSeedPentadecathlon = function(dimension) {
    newSeed(dimension);

    cellMatrix[5][10].isAlive = "true";
    cellMatrix[5][10].backgroundColor = "black";
    cellMatrix[6][9].isAlive = "true";
    cellMatrix[6][9].backgroundColor = "black";
    cellMatrix[6][11].isAlive = "true";
    cellMatrix[6][11].backgroundColor = "black";
    cellMatrix[7][8].isAlive = "true";
    cellMatrix[7][8].backgroundColor = "black";
    cellMatrix[7][12].isAlive = "true";
    cellMatrix[7][12].backgroundColor = "black";
    cellMatrix[8][8].isAlive = "true";
    cellMatrix[8][8].backgroundColor = "black";
    cellMatrix[8][12].isAlive = "true";
    cellMatrix[8][12].backgroundColor = "black";
    cellMatrix[9][8].isAlive = "true";
    cellMatrix[9][8].backgroundColor = "black";
    cellMatrix[9][12].isAlive = "true";
    cellMatrix[9][12].backgroundColor = "black";
    cellMatrix[10][8].isAlive = "true";
    cellMatrix[10][8].backgroundColor = "black";
    cellMatrix[10][12].isAlive = "true";
    cellMatrix[10][12].backgroundColor = "black";
    cellMatrix[11][8].isAlive = "true";
    cellMatrix[11][8].backgroundColor = "black";
    cellMatrix[11][12].isAlive = "true";
    cellMatrix[11][12].backgroundColor = "black";
    cellMatrix[12][8].isAlive = "true";
    cellMatrix[12][8].backgroundColor = "black";
    cellMatrix[12][12].isAlive = "true";
    cellMatrix[12][12].backgroundColor = "black";
    cellMatrix[13][9].isAlive = "true";
    cellMatrix[13][9].backgroundColor = "black";
    cellMatrix[13][11].isAlive = "true";
    cellMatrix[13][11].backgroundColor = "black";
    cellMatrix[14][10].isAlive = "true";
    cellMatrix[14][10].backgroundColor = "black";

    updateMatrixDisplay();
  }


  var getPatternSeedGlider = function(dimension) {
    newSeed(dimension);

    cellMatrix[22][23].isAlive = "true";
    cellMatrix[22][23].backgroundColor = "black";
    cellMatrix[23][24].isAlive = "true";
    cellMatrix[23][24].backgroundColor = "black";
    cellMatrix[24][22].isAlive = "true";
    cellMatrix[24][22].backgroundColor = "black";
    cellMatrix[24][23].isAlive = "true";
    cellMatrix[24][23].backgroundColor = "black";
    cellMatrix[24][24].isAlive = "true";
    cellMatrix[24][24].backgroundColor = "black";

    updateMatrixDisplay();
  }


  var getPatternSeedLightweightSpaceship = function(dimension) {
    newSeed(dimension);

    cellMatrix[22][21].isAlive = "true";
    cellMatrix[22][21].backgroundColor = "black";
    cellMatrix[22][24].isAlive = "true";
    cellMatrix[22][24].backgroundColor = "black";
    cellMatrix[23][25].isAlive = "true";
    cellMatrix[23][25].backgroundColor = "black";
    cellMatrix[24][21].isAlive = "true";
    cellMatrix[24][21].backgroundColor = "black";
    cellMatrix[24][25].isAlive = "true";
    cellMatrix[24][25].backgroundColor = "black";
    cellMatrix[25][22].isAlive = "true";
    cellMatrix[25][22].backgroundColor = "black";
    cellMatrix[25][23].isAlive = "true";
    cellMatrix[25][23].backgroundColor = "black";
    cellMatrix[25][24].isAlive = "true";
    cellMatrix[25][24].backgroundColor = "black";
    cellMatrix[25][25].isAlive = "true";
    cellMatrix[25][25].backgroundColor = "black";

    updateMatrixDisplay();
  }


  var getPatternSeedMiddleweightSpaceship = function(dimension) {
    newSeed(dimension);

    cellMatrix[22][22].isAlive = "true";
    cellMatrix[22][22].backgroundColor = "black";
    cellMatrix[22][23].isAlive = "true";
    cellMatrix[22][23].backgroundColor = "black";
    cellMatrix[22][24].isAlive = "true";
    cellMatrix[22][24].backgroundColor = "black";
    cellMatrix[23][21].isAlive = "true";
    cellMatrix[23][21].backgroundColor = "black";
    cellMatrix[23][22].isAlive = "true";
    cellMatrix[23][22].backgroundColor = "black";
    cellMatrix[23][23].isAlive = "true";
    cellMatrix[23][23].backgroundColor = "black";
    cellMatrix[23][24].isAlive = "true";
    cellMatrix[23][24].backgroundColor = "black";
    cellMatrix[23][25].isAlive = "true";
    cellMatrix[23][25].backgroundColor = "black";
    cellMatrix[24][20].isAlive = "true";
    cellMatrix[24][20].backgroundColor = "black";
    cellMatrix[24][21].isAlive = "true";
    cellMatrix[24][21].backgroundColor = "black";
    cellMatrix[24][23].isAlive = "true";
    cellMatrix[24][23].backgroundColor = "black";
    cellMatrix[24][24].isAlive = "true";
    cellMatrix[24][24].backgroundColor = "black";
    cellMatrix[24][25].isAlive = "true";
    cellMatrix[24][25].backgroundColor = "black";
    cellMatrix[25][21].isAlive = "true";
    cellMatrix[25][21].backgroundColor = "black";
    cellMatrix[25][22].isAlive = "true";
    cellMatrix[25][22].backgroundColor = "black";

    updateMatrixDisplay();
  }


  var getPatternSeedHeavyweightSpaceship = function(dimension) {
    newSeed(dimension);

    cellMatrix[22][21].isAlive = "true";
    cellMatrix[22][21].backgroundColor = "black";
    cellMatrix[22][22].isAlive = "true";
    cellMatrix[22][22].backgroundColor = "black";
    cellMatrix[22][23].isAlive = "true";
    cellMatrix[22][23].backgroundColor = "black";
    cellMatrix[22][24].isAlive = "true";
    cellMatrix[22][24].backgroundColor = "black";
    cellMatrix[23][20].isAlive = "true";
    cellMatrix[23][20].backgroundColor = "black";
    cellMatrix[23][21].isAlive = "true";
    cellMatrix[23][21].backgroundColor = "black";
    cellMatrix[23][22].isAlive = "true";
    cellMatrix[23][22].backgroundColor = "black";
    cellMatrix[23][23].isAlive = "true";
    cellMatrix[23][23].backgroundColor = "black";
    cellMatrix[23][24].isAlive = "true";
    cellMatrix[23][24].backgroundColor = "black";
    cellMatrix[23][25].isAlive = "true";
    cellMatrix[23][25].backgroundColor = "black";
    cellMatrix[24][19].isAlive = "true";
    cellMatrix[24][19].backgroundColor = "black";
    cellMatrix[24][20].isAlive = "true";
    cellMatrix[24][20].backgroundColor = "black";
    cellMatrix[24][22].isAlive = "true";
    cellMatrix[24][22].backgroundColor = "black";
    cellMatrix[24][23].isAlive = "true";
    cellMatrix[24][23].backgroundColor = "black";
    cellMatrix[24][24].isAlive = "true";
    cellMatrix[24][24].backgroundColor = "black";
    cellMatrix[24][25].isAlive = "true";
    cellMatrix[24][25].backgroundColor = "black";
    cellMatrix[25][20].isAlive = "true";
    cellMatrix[25][20].backgroundColor = "black";
    cellMatrix[25][21].isAlive = "true";
    cellMatrix[25][21].backgroundColor = "black";

    updateMatrixDisplay();
  }


  var getPatternSeedRPentomino = function(dimension) {
    newSeed(dimension);

    //45 x 45
    // cellMatrix[22][23].isAlive = "true";
    // cellMatrix[22][23].backgroundColor = "black";
    // cellMatrix[22][24].isAlive = "true";
    // cellMatrix[22][24].backgroundColor = "black";
    // cellMatrix[23][22].isAlive = "true";
    // cellMatrix[23][22].backgroundColor = "black";
    // cellMatrix[23][23].isAlive = "true";
    // cellMatrix[23][23].backgroundColor = "black";
    // cellMatrix[24][23].isAlive = "true";
    // cellMatrix[24][23].backgroundColor = "black";

    //68 x 68
    // cellMatrix[34][35].isAlive = "true";
    // cellMatrix[34][35].backgroundColor = "black";
    // cellMatrix[34][36].isAlive = "true";
    // cellMatrix[34][36].backgroundColor = "black";
    // cellMatrix[35][34].isAlive = "true";
    // cellMatrix[35][34].backgroundColor = "black";
    // cellMatrix[35][35].isAlive = "true";
    // cellMatrix[35][35].backgroundColor = "black";
    // cellMatrix[36][35].isAlive = "true";
    // cellMatrix[36][35].backgroundColor = "black";

    //100 x 100
    cellMatrix[50][50].isAlive = "true";
    cellMatrix[50][50].backgroundColor = "black";
    cellMatrix[50][51].isAlive = "true";
    cellMatrix[50][51].backgroundColor = "black";
    cellMatrix[51][49].isAlive = "true";
    cellMatrix[51][49].backgroundColor = "black";
    cellMatrix[51][50].isAlive = "true";
    cellMatrix[51][50].backgroundColor = "black";
    cellMatrix[52][50].isAlive = "true";
    cellMatrix[52][50].backgroundColor = "black";

    updateMatrixDisplay();
  }


  var getPatternSeedDiehard = function(dimension) {
    newSeed(dimension);

    cellMatrix[22][26].isAlive = "true";
    cellMatrix[22][26].backgroundColor = "black";
    cellMatrix[23][20].isAlive = "true";
    cellMatrix[23][20].backgroundColor = "black";
    cellMatrix[23][21].isAlive = "true";
    cellMatrix[23][21].backgroundColor = "black";
    cellMatrix[24][21].isAlive = "true";
    cellMatrix[24][21].backgroundColor = "black";
    cellMatrix[24][25].isAlive = "true";
    cellMatrix[24][25].backgroundColor = "black";
    cellMatrix[24][26].isAlive = "true";
    cellMatrix[24][26].backgroundColor = "black";
    cellMatrix[24][27].isAlive = "true";
    cellMatrix[24][27].backgroundColor = "black";

    updateMatrixDisplay();
  }


  var getPatternSeedAcorn = function(dimension) {
    newSeed(dimension);

    //45 x 45
    // cellMatrix[22][21].isAlive = "true";
    // cellMatrix[22][21].backgroundColor = "black";
    // cellMatrix[23][23].isAlive = "true";
    // cellMatrix[23][23].backgroundColor = "black";
    // cellMatrix[24][20].isAlive = "true";
    // cellMatrix[24][20].backgroundColor = "black";
    // cellMatrix[24][21].isAlive = "true";
    // cellMatrix[24][21].backgroundColor = "black";
    // cellMatrix[24][24].isAlive = "true";
    // cellMatrix[24][24].backgroundColor = "black";
    // cellMatrix[24][25].isAlive = "true";
    // cellMatrix[24][25].backgroundColor = "black";
    // cellMatrix[24][26].isAlive = "true";
    // cellMatrix[24][26].backgroundColor = "black";

    //90 x 90
    // cellMatrix[44][43].isAlive = "true";
    // cellMatrix[44][43].backgroundColor = "black";
    // cellMatrix[45][45].isAlive = "true";
    // cellMatrix[45][45].backgroundColor = "black";
    // cellMatrix[46][42].isAlive = "true";
    // cellMatrix[46][42].backgroundColor = "black";
    // cellMatrix[46][43].isAlive = "true";
    // cellMatrix[46][43].backgroundColor = "black";
    // cellMatrix[46][46].isAlive = "true";
    // cellMatrix[46][46].backgroundColor = "black";
    // cellMatrix[46][47].isAlive = "true";
    // cellMatrix[46][47].backgroundColor = "black";
    // cellMatrix[46][48].isAlive = "true";
    // cellMatrix[46][48].backgroundColor = "black";

    //250 x 250
    cellMatrix[135][124].isAlive = "true";
    cellMatrix[135][124].backgroundColor = "black";
    cellMatrix[136][126].isAlive = "true";
    cellMatrix[136][126].backgroundColor = "black";
    cellMatrix[137][123].isAlive = "true";
    cellMatrix[137][123].backgroundColor = "black";
    cellMatrix[137][124].isAlive = "true";
    cellMatrix[137][124].backgroundColor = "black";
    cellMatrix[137][127].isAlive = "true";
    cellMatrix[137][127].backgroundColor = "black";
    cellMatrix[137][128].isAlive = "true";
    cellMatrix[137][128].backgroundColor = "black";
    cellMatrix[137][129].isAlive = "true";
    cellMatrix[137][129].backgroundColor = "black";

    updateMatrixDisplay();
  }


  var getPatternSeedGosperGliderGun = function(dimension) {
    newSeed(dimension);

    cellMatrix[19][29].isAlive = "true";
    cellMatrix[19][29].backgroundColor = "black";
    cellMatrix[20][27].isAlive = "true";
    cellMatrix[20][27].backgroundColor = "black";
    cellMatrix[20][29].isAlive = "true";
    cellMatrix[20][29].backgroundColor = "black";
    cellMatrix[21][17].isAlive = "true";
    cellMatrix[21][17].backgroundColor = "black";
    cellMatrix[21][18].isAlive = "true";
    cellMatrix[21][18].backgroundColor = "black";
    cellMatrix[21][25].isAlive = "true";
    cellMatrix[21][25].backgroundColor = "black";
    cellMatrix[21][26].isAlive = "true";
    cellMatrix[21][26].backgroundColor = "black";
    cellMatrix[21][39].isAlive = "true";
    cellMatrix[21][39].backgroundColor = "black";
    cellMatrix[21][40].isAlive = "true";
    cellMatrix[21][40].backgroundColor = "black";
    cellMatrix[22][16].isAlive = "true";
    cellMatrix[22][16].backgroundColor = "black";
    cellMatrix[22][20].isAlive = "true";
    cellMatrix[22][20].backgroundColor = "black";
    cellMatrix[22][25].isAlive = "true";
    cellMatrix[22][25].backgroundColor = "black";
    cellMatrix[22][26].isAlive = "true";
    cellMatrix[22][26].backgroundColor = "black";
    cellMatrix[22][39].isAlive = "true";
    cellMatrix[22][39].backgroundColor = "black";
    cellMatrix[22][40].isAlive = "true";
    cellMatrix[22][40].backgroundColor = "black";
    cellMatrix[23][5].isAlive = "true";
    cellMatrix[23][5].backgroundColor = "black";
    cellMatrix[23][6].isAlive = "true";
    cellMatrix[23][6].backgroundColor = "black";
    cellMatrix[23][15].isAlive = "true";
    cellMatrix[23][15].backgroundColor = "black";
    cellMatrix[23][21].isAlive = "true";
    cellMatrix[23][21].backgroundColor = "black";
    cellMatrix[23][25].isAlive = "true";
    cellMatrix[23][25].backgroundColor = "black";
    cellMatrix[23][26].isAlive = "true";
    cellMatrix[23][26].backgroundColor = "black";
    cellMatrix[24][5].isAlive = "true";
    cellMatrix[24][5].backgroundColor = "black";
    cellMatrix[24][6].isAlive = "true";
    cellMatrix[24][6].backgroundColor = "black";
    cellMatrix[24][15].isAlive = "true";
    cellMatrix[24][15].backgroundColor = "black";
    cellMatrix[24][19].isAlive = "true";
    cellMatrix[24][19].backgroundColor = "black";
    cellMatrix[24][21].isAlive = "true";
    cellMatrix[24][21].backgroundColor = "black";
    cellMatrix[24][22].isAlive = "true";
    cellMatrix[24][22].backgroundColor = "black";
    cellMatrix[24][27].isAlive = "true";
    cellMatrix[24][27].backgroundColor = "black";
    cellMatrix[24][29].isAlive = "true";
    cellMatrix[24][29].backgroundColor = "black";
    cellMatrix[25][15].isAlive = "true";
    cellMatrix[25][15].backgroundColor = "black";
    cellMatrix[25][21].isAlive = "true";
    cellMatrix[25][21].backgroundColor = "black";
    cellMatrix[25][29].isAlive = "true";
    cellMatrix[25][29].backgroundColor = "black";
    cellMatrix[26][16].isAlive = "true";
    cellMatrix[26][16].backgroundColor = "black";
    cellMatrix[26][20].isAlive = "true";
    cellMatrix[26][20].backgroundColor = "black";
    cellMatrix[27][17].isAlive = "true";
    cellMatrix[27][17].backgroundColor = "black";
    cellMatrix[27][18].isAlive = "true";
    cellMatrix[27][18].backgroundColor = "black";

    updateMatrixDisplay();
  }


  return {
    Grid: Grid,
    Cell: Cell,
    demo: demo,
    newSeed: newSeed,
    scale: scale,
    rate: rate,
    step: step,
    start: start,
    pause: pause,
    resum: resume,
    stop: stop,
    showCellNeighbors: showCellNeighbors,
    reset: reset,
    clearGrid: clearGrid,
    refresh: refresh,
    save: save,
    getPatternSeedStillLife: getPatternSeedStillLife,
    getPatternSeedOscillators: getPatternSeedOscillators,
    getPatternSeedSpaceships: getPatternSeedSpaceships,
    getPatternSeedMethuselahs: getPatternSeedMethuselahs,
    getPatternSeedInfinite: getPatternSeedInfinite
  };

})();
//End Module GameOfLife
