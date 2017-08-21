var app = angular.module('MainModule', ['angularImageAnnotaionModule']);

app.controller('MainCtrl', function($scope) {
  $scope.name = 'World'; 

  
  $scope.notes = [
    {left:36,top:207,width:168,height:56,id:"1"},
    {left:136,top:307,width:168,height:96,id:"2"}
  ];
  
  
  $scope.draw = function(){
    $scope.angularImageAnnotationApi.draw();
    $scope.editMode=false;
    $scope.drawingMode=true;
  }
  $scope.edit = function(bool){
    $scope.editMode=bool;
    $scope.drawingMode=false;
    $scope.angularImageAnnotationApi.edit(bool);
  }
  
  $scope.processNewNote = function(note){
    $scope.drawingMode=false;
    if(!$scope.notes){
      $scope.notes=[];
    }
    $scope.notes.push(note);
  }
  
  $scope.deleteNote = function(index){
    $scope.notes.splice(index,1);
  }
  
});


