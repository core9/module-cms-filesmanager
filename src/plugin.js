angular.module( 'core9Dashboard.filesmanager', [
  'core9Dashboard.files',
  'core9Dashboard.files.feature',
  'templates-plugin-files-manager-admin'
  ])

;

angular.module('core9Dashboard.admin.dashboard').requires.push('core9Dashboard.filesmanager');