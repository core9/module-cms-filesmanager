angular.module('core9Dashboard.files', [
  'ui.router',
  'ui.bootstrap',
  'ngResource',
  'angularFileUpload',
  'core9Dashboard.menu',
  'ui.codemirror'
  ])

.factory('FileFactory', function($resource) {
  return $resource('/admin/files/:fileid', {fileid: '@_id'}, {update: {method: 'PUT' }});
})

.factory('FileViewer', function($templateCache) {
  var fileViewers = {};
  var contentTypes = {};

  function FileViewer(config){
    angular.copy(config, this);
  }

  FileViewer.get = function(name) {
    return new FileViewer(fileViewers[name]);
  };

  FileViewer.getForContentType = function(contentType) {
    console.log(contentType);
    return fileViewers[contentTypes[contentType]];
  };

  FileViewer.getAll = function() {
    var keys = [];
    for(var key in fileViewers) {
      keys.push(key);
    }
    return keys;
  };

  FileViewer.prototype['addContentType'] = function(contentType) {
    if(contentType instanceof Array) {
      for(var n = 0; n < contentType.length; n++) {
        contentTypes[contentType[n]] = this.name;
      }
    } else {
      contentTypes[contentType] = this.name;
    }
    return this;
  };

  FileViewer.prototype['save'] = function() {
    fileViewers[this.name] = this;
    return fileViewers[this.name];
  };

  FileViewer.prototype['render'] = function() {
    return $templateCache.get(this.template);
  };

  return FileViewer;
})

.config(function($stateProvider) {
  $stateProvider
  .state('files',  {
    url: '/config/files',
    views: {
      "main": {
        controller: 'FilesCtrl',
        templateUrl: 'files/files.tpl.html'
      }
    },
    data:{ pageTitle: 'Files' }
  })
  .state('fileedit',  {
    url: '/config/files/:id',
    views: {
      "main": {
        controller: 'EditFileCtrl',
        templateUrl: 'files/edit.tpl.html'
      }
    },
    data:{ pageTitle: 'Files' }
  });
})

.controller('FilesCtrl', function($scope, $state, $location, FileFactory) {
  var dir = $location.search().dir;
  if(dir !== undefined && dir !== null) {
    $scope.folder = dir;
  } else {
    $scope.folder = '/';
  }
  $scope.files = FileFactory.query({folder: $scope.folder});
  $scope.addFile = function() {
    var file = new FileFactory();
    file.filename = "ReplaceMe";
    file.metadata = {folder: $scope.folder, type: "File"};
    file.$save(function(data) {
      $scope.files.push(data);
      $state.go("fileedit", {id: data._id});
    });
  };
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
  $scope.update = function() {
    $scope.files = FileFactory.query({folder: $scope.folder});
  };
  $scope.remove = function(file) {
    file.$remove(function() {
      $scope.update();
    });
  };
  $scope.$watch('folder', function() {
    if($scope.folder !== undefined) {
      $location.search('dir', $scope.folder);
      $scope.update();
    }
  });
})

.controller('EditFileCtrl', function($scope, $location, FileFactory, $stateParams, FileViewer) {
  $scope.mimeTypes = {
    'txt': 'text/plain',
    'css': 'text/css',
    'less': 'text/less',
    'jpg': 'image/jpeg',
    'dir': 'inode/directory'
  };
  $scope.file = FileFactory.get({fileid: $stateParams.id});
  $scope.types = ['Directory', 'File'];
  $scope.save = function() {
    $scope.file.$update(function() {
      $scope.back();  
    });
  };
  $scope.$watch('file.metadata.type', function(newValue, oldValue) {
    if(newValue === 'Directory') {
      $scope.file.contentType = 'inode/directory';
    }
  });
  $scope.$watch('file.filename', function(newValue, oldValue) {
    if(newValue !== undefined && oldValue !== undefined && $scope.file.metadata.type === 'File') {
      var extension = newValue.substring(newValue.lastIndexOf('.') + 1);
      if($scope.mimeTypes[extension] !== undefined) {
        $scope.file.contentType = $scope.mimeTypes[extension];
      }
    }
  });
  $scope.back = function() {
    $location.path("/config/files").search("dir", $scope.file.metadata.folder);
  };
})

.directive('cnFileEditor', function(FileViewer, $compile) {
  return {
    replace: true,
    scope: {
      filename: '@',
      filetype: '='
    },
    link: function(scope, element, attrs) {
      scope.$watch('filetype', function(newValue, oldValue) {
        element.html("");
        $compile(element.contents())(scope);
        if(newValue !== undefined) {
          element.html(FileViewer.getForContentType(scope.filetype).render());
          $compile(element.contents())(scope);
        }
      });
    }
  };
})

.controller('FileUploadCtrl', function($scope, $upload, FileFactory) {
  var progress = function(evt) {
    console.log('percent: ' + parseInt(100.0 * evt.loaded / evt.total));
  };
  var success = function(data, status, headers, config) {
    $scope.$parent.files = FileFactory.query({folder: $scope.$parent.folder});
  };
  $scope.onFileSelect = function($files) {
    for (var i = 0; i < $files.length; i++) {
      var file = $files[i];
      $scope.upload = $upload.upload({
        url: 'admin/files',
        file: file,
        fileFormDataName: $scope.$parent.folder,
      }).progress(progress).success(success);
    }
  };
})

.controller('CoreLessController', function($scope, $http) {
  $scope.editorOptions = {
    mode: 'less',
    fullScreen: false,
    lineWrapping: true,
    lineNumbers: true,
    onLoad: function(editor) {
      $http.get($scope.filename)
      .success(function(data) {
        $scope.fileContents = data;
      });  
    }
  };
  $scope.save = function() {
    $http.put($scope.filename, {content: $scope.fileContents})
    .error(function() {
      alert("Failed, see output in backend console.");
    });
  };
})

.controller('CoreTextController', function($scope, $http) {
  $scope.editorOptions = {
    fullScreen: false,
    lineWrapping: true,
    lineNumbers: true,
    onLoad: function(editor) {
      $http.get($scope.filename)
      .success(function(data) {
        $scope.fileContents = data;
      });  
    }
  };
  $scope.save = function() {
    $http.put($scope.filename, {content: $scope.fileContents})
    .error(function() {
      alert("Failed, see output in backend console.");
    });
  };
})

.controller('coreFileSelectorCtrl', function($scope, $modal) {
  $scope.browse = function () {

    var modalInstance = $modal.open({
      templateUrl: 'files/field/file.selector.tpl.html',
      controller: 'coreFileSelectorBrowserCtrl',
      resolve: {
        folder: function() {
          return $scope.options.filepath !== null ? $scope.options.filepath : '/';
        }
      }
    });

    modalInstance.result.then(function(selected) {
      if(selected !== undefined) {
        $scope.$parent.data = "/static" + selected;
      }
    });
  };
})

.controller('coreFileSelectorBrowserCtrl', function($scope, $modalInstance, folder, FileFactory) {
  $scope.folder = folder;
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

  $scope.select = function(file) {
    $scope.selected = file;
  };

  $scope.ok = function() {
    if($scope.selected !== undefined) {
      $modalInstance.close($scope.folder + $scope.selected.filename);
    } else {
      $scope.cancel();
    }
  };

  $scope.cancel = function() {
    $modalInstance.close();
  };

  $scope.$watch('folder', function() {
    if($scope.folder !== undefined) {
      $scope.files = FileFactory.query({folder: $scope.folder});
    }
  });

})

.run(function(MenuService, FileViewer, FieldConfig) {
  MenuService.add('config', {title: "Files", weight: 150, link: "/config/files"});
  new FileViewer({name: 'image', template: "files/viewer/image.tpl.html"})
    .addContentType([
      'image/bmp','image/cis-cod','image/gif',
      'image/ief','image/jpeg','image/jpeg',
      'image/jpeg','image/pipeg','image/svg+xml',
      'image/tiff','image/tiff','image/x-cmu-raster',
      'image/x-cmx','image/x-icon','image/x-portable-anymap',
      'image/x-portable-bitmap','image/x-portable-graymap',
      'image/x-portable-pixmap','image/x-rgb','image/x-xbitmap',
      'image/x-xpixmap','image/x-xwindowdump'
    ]).save();
  new FileViewer({name: 'less', template: "files/viewer/less.tpl.html"}).addContentType(['text/css', 'text/less']).save();
  new FileViewer({name: 'text', template: "files/viewer/text.tpl.html"}).addContentType(['text/plain']).save();
  new FieldConfig({type: 'file'})
    .addWidget('file', {template: "files/field/file.tpl.html", config: "files/field/file.config.tpl.html"}).save();

})
;
