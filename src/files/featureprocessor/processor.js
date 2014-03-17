angular.module( 'core9Dashboard.files.feature', [
  'ui.bootstrap',
  'core9Dashboard.files'
])

.controller('FeatureProcessorFilesCtrl', function($scope, $modal) {

  $scope.add = function () {
    var modalInstance = $modal.open({
      templateUrl: 'files/featureprocessor/processor.modal.tpl.html',
      controller: 'FeatureProcessorFilesModalCtrl',
      resolve: {
        selected: function() {
            return $scope.$parent.selected;
        }
      }
    });
  };
})

.controller('FeatureProcessorFilesModalCtrl', function($scope, $modalInstance, FileFactory, selected) {
  $scope.folder = "/";
  $scope.files = FileFactory.query({folder: $scope.folder});

  $scope.switchTo = function(newFolder) {
    var folder = "/";
    if(newFolder === "/") {
      var index = $scope.folder.substring(0, $scope.folder.length -1).lastIndexOf("/");
      folder = $scope.folder.substring(0, index) + newFolder;
    } else {
      folder = $scope.folder + newFolder + "/";
    }
    $scope.folder = folder;
  };

  $scope.$watch('folder', function() {
    if($scope.folder !== undefined) {
      $scope.files = FileFactory.query({folder: $scope.folder});
    }
  });

  $scope.isSelected = function(fileid) {
    for(var i = 0; i < selected.length; i++) {
        if(selected[i].id === fileid) {
            if(selected[i].remove === undefined) {
              return true;
            }
        }
    }
    return false;
  };

  $scope.select = function(file) {
    var deleted = false;
    for(var i = 0; i < selected.length; i++) {
        if(selected[i].id === file._id) {
            deleted = true;
            selected[i].remove = true;
        }
    }
    if(!deleted) {
        selected.push({id: file._id, entry: file});
    }
  };

  $scope.ok = function() {
    $modalInstance.close();
  };
})
;