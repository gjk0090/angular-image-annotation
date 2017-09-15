/*
	Angular Image Annotation version 1.0.0
	Junkai Gao 2017
	http://github.com/??????
	This AngularJS module provides a directive which allows user to highlight area of interest in an image.

	[attribute]
	angular-image-annotation : the image annotation directive.
	notes : a list of existing annotations.
	read-only : a switch to turn on/off adding and editing. string 'true' means true.
	api : a holder object for the methods exposed by the directive.
	process-new-note : the method which will be called on creation of new annotation.
	delete-note : the method which will be called on deleting of an annotation.

	<img
		src="xxx.jpg"
		angular-image-annotation
		notes="notes"
		read-only="true"
		api="angularImageAnnotationApi"
		process-new-note="processNewNote(note)"
		delete-note="deleteNote(index)"
	/>
*/


(function ( angular ) {

'use strict';

angular.module( 'angularImageAnnotaionModule', [] ).directive('angularImageAnnotation',function($compile, $timeout){
  
  return {
    restrict: 'A',
    scope: {
      src: '@',
      notes: '=',
      readOnly: '@',
      api: '=',
      externalProcessNewNote: '&processNewNote',
      externalDeleteNote: '&deleteNote'
    },
    //replace:true,
    //templateUrl: 'template.html',
    link: function(scope, elem, attrs) {
      
      if(!scope.src){
        //todo: show error somewhere
        return false;
      }

      //copy $timeoutnotes to avoid directly modifying original object
      scope.localNotes = angular.copy(scope.notes||[]);
      scope.$watch('notes.length', function(value) {
        scope.localNotes = angular.copy(scope.notes||[]);
      });
      
      //hide <img> and append <div> with same image as backgrond
      //should this be done in compile()?
      scope.width = elem[0].clientWidth || 1000;
      scope.height = elem[0].clientHeight || 1000;
      elem.css('display', "none");
      
      var template = 
      '<div id="angularImageAnnotationCanvas" style="position:relative; background-image: url(\'{{src}}\');" ng-style="{\'width\':width+\'px\',\'height\':height+\'px\'}">'
        +'<div ng-repeat="note in localNotes">'
          +'<div style="border:solid 1px blue; position:absolute;" ng-style="{\'left\':note.left+\'px\',\'top\':note.top+\'px\',\'width\':note.width+\'px\',\'height\':note.height+\'px\'}">'
            +'<button class="btn btn-default btn-xs pull-right" style="z-index:1; position:relative;" ng-if="editMode" ng-click="deleteNote($index, note.id);">delete</button>'
          +'</div>'
        +'</div>'
        +'<div style="position:absolute; background-color:yellow; opacity:0.5;" ng-if="tempNote" '
        +'ng-style="{\'left\':tempNote.left+\'px\',\'top\':tempNote.top+\'px\',\'width\':tempNote.width+\'px\',\'height\':tempNote.height+\'px\'}"></div>'
      +'</div>';

      (function() {       
	      elem.after($compile(template)(scope));      
      });

      scope.draw = function(){
        
        if(scope.readOnly=='true'){return false;}
        
        scope.canvas = document.getElementById('angularImageAnnotationCanvas');
        
        //additional logic for css zoom property
        var style = window.getComputedStyle(scope.canvas);
        var zoom = style.getPropertyValue('zoom');
        if(zoom=="normal"){
          scope.zoom = 1;
        }else if(zoom.indexOf("%")==-1){
          scope.zoom=parseInt(zoom);
        }else{
          scope.zoom=parseInt(zoom)/100;
        }
        //alert(scope.zoom);

        scope.canvas.addEventListener('mousedown', scope.handleMouseDown, false);
        scope.editMode=false;
      };
      
      scope.edit = function(bool){
        
        if(scope.readOnly=='true'){return false;}
        
        scope.editMode=bool;
        
        scope.canvas.removeEventListener('mousedown', scope.handleMouseDown, false);
      }
      
      scope.deleteNote=function(index, noteID){
        //scope.localNotes.splice(index,1);
        if(scope.externalDeleteNote){
          scope.externalDeleteNote({index:index, id:noteID});
        }else{
          //todo: show error somewhere
        }
      }
  
      //methods exposed to elem's scope
      scope.api={
        draw:scope.draw,
        edit:scope.edit
      };
      

      //methods for image annotating
      //code took from stackoverflow:
      //https://stackoverflow.com/questions/43956540/receiving-the-coordinates-of-a-mouse-drag
      scope.handleMouseDown=function(e) {
        var mousePos = scope.getMousePosition(scope.canvas, e);
        //alert(mousePos.left + " "  + mousePos.top);
        scope.canvas.removeEventListener('mousedown', scope.handleMouseDown, false);
        scope.canvas.addEventListener('mousemove', scope.handleMouseMove, false);
    
        scope.tempNote={left:mousePos.left,top:mousePos.top};
        scope.startPoint={left:mousePos.left,top:mousePos.top};
        scope.$apply();
      }      
      
      scope.handleMouseMove=function(e) {
        scope.canvas.addEventListener('mouseup', scope.handleMouseUp, false);   
        var mousePos = scope.getMousePosition(scope.canvas, e);
        //console.log(mousePos.left + " "  + mousePos.top);
        if(scope.tempNote){
          scope.endPoint={left:mousePos.left,top:mousePos.top};
          scope.tempNote={
            left:scope.endPoint.left>scope.startPoint.left?scope.startPoint.left:scope.endPoint.left,
            top:scope.endPoint.top>scope.startPoint.top?scope.startPoint.top:scope.endPoint.top,
            width:scope.endPoint.left>scope.startPoint.left?(scope.endPoint.left-scope.startPoint.left):(scope.startPoint.left-scope.endPoint.left),
            height:scope.endPoint.top>scope.startPoint.top?(scope.endPoint.top-scope.startPoint.top):(scope.startPoint.top-scope.endPoint.top)
          }
        }
        scope.$apply();
      }
      
      scope.handleMouseUp=function(e) {
        var mousePos = scope.getMousePosition(scope.canvas, e);
        //alert(mousePos.left + " "  + mousePos.top);
        scope.endPoint={left:mousePos.left,top:mousePos.top};
    
        scope.canvas.removeEventListener('mouseup', scope.handleMouseUp, false);  
        scope.canvas.removeEventListener('mousemove', scope.handleMouseMove, false);
        
        var newNote = {
          left:scope.endPoint.left>scope.startPoint.left?scope.startPoint.left:scope.endPoint.left,
          top:scope.endPoint.top>scope.startPoint.top?scope.startPoint.top:scope.endPoint.top,
          width:scope.endPoint.left>scope.startPoint.left?(scope.endPoint.left-scope.startPoint.left):(scope.startPoint.left-scope.endPoint.left),
          height:scope.endPoint.top>scope.startPoint.top?(scope.endPoint.top-scope.startPoint.top):(scope.startPoint.top-scope.endPoint.top)
        };
        //scope.localNotes.push(newNote);
        if(scope.externalProcessNewNote){
          scope.externalProcessNewNote({note:newNote});
        }else{
          //todo: show error somewhere
        }
        
        scope.tempNote=null;
        scope.$apply();
      }

      scope.getMousePosition=function(canvas, e) {
        var boundary = canvas.getBoundingClientRect();
        // (e.clientX, e.clientY)  => Mouse coordinates wrt whole browser
        //  (boundary.left, boundary.top) => Canvas starting coordinate
        var left = Math.round(e.clientX - boundary.left);
        var top = Math.round(e.clientY - boundary.top);
        
        //additional logic for css zoom property
        if(scope.zoom){
          left=left/scope.zoom;
          top=top/scope.zoom;
        }
        
        return {
          left: left,  
          top: top
        };
      };

    }

  }
});



})( angular );
