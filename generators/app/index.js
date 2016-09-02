'use strict';
var yeoman = require('yeoman-generator');
var chalk = require('chalk');
var yosay = require('yosay');
var del = require('del');
var nd = require('node-dir');
var Guid = require('guid');
var updateNotifier = require('update-notifier');
var pkg = require('./../../package.json');
var path = require('path');

module.exports = yeoman.generators.Base.extend({
  
  prompting: function () {
    var done = this.async();

    // greet the user
    this.log(yosay('Welcome to the fantastic Yeoman ' + chalk.green('dgp-api-aspnetcore') + ' ' + chalk.blue('(' + pkg.version + ')') + ' generator!'));
    
    var notifier = updateNotifier({
        pkg,
        updateCheckInterval: 1000 * 60 * 5      // check every 5 minutes. 
    });
    notifier.notify();
    if (notifier.update != undefined) return;
    
    // ask project parameters
    var prompts = [{
      type: 'input',
      name: 'deleteContent',
      message: 'Delete the contents of this directory before generation (.git will be preserved) ? (y/n):',
      default: 'y'
    },
    {
      type: 'input',
      name: 'projectName',
      message: "Enter the name of the new project (don't forget the Pascal-casing):"
    }, 
    {
      type: 'input',
      name: 'kestrelHttpPort',
      message: 'Enter the HTTP port for the kestrel server:'
    }, 
    {
      type: 'input',
      name: 'iisHttpPort',
      message: 'Enter the HTTP port for the IIS Express server:'
    },
    {
      type: 'input',
      name: 'iisHttpsPort',
      message: 'Enter the HTTPS port for the IIS Express server:'
    },
    {
      type: 'input',
      name: 'dataProvider',
      message: 'Will you be using Entity Framework with SQLServer, PostgreSQL or Not ? (s/p/n):',
      default: 'p'
    }];

    this.prompt(prompts, function (props) {
      this.props = props;     // To access props later use this.props.someOption;
      done();
    }.bind(this));
  },

  writing: function () {
  
    // empty target directory
    console.log('Emptying target directory...');
    if ( this.props.deleteContent == 'y' ) {
        del.sync(['**/*', '!.git', '!.git/**/*'], { force: true, dot: true });
    }
    
    var projectName = this.props.projectName;
    var lowerProjectName = projectName.toLowerCase(); 
    
    var solutionItemsGuid = Guid.create();
    var srcGuid = Guid.create();
    var testGuid = Guid.create();
    var starterKitGuid = Guid.create();
    var integrationGuid = Guid.create();
    var unitGuid = Guid.create();
    
    var kestrelHttpPort = this.props.kestrelHttpPort;
    var iisHttpPort = this.props.iisHttpPort;
    var iisHttpsPort = this.props.iisHttpsPort;
    var dataProvider = getDataProvider(this.props.dataProvider);
    
    var copyOptions = { 
      process: function(contents) {
        var str = contents.toString();
        var result = str.replace(/StarterKit/g, projectName)
                        .replace(/starterkit/g, lowerProjectName)
                        .replace(/C3E0690A-0044-402C-90D2-2DC0FF14980F/g, solutionItemsGuid.value.toUpperCase())
                        .replace(/05A3A5CE-4659-4E00-A4BB-4129AEBEE7D0/g, srcGuid.value.toUpperCase())
                        .replace(/079636FA-0D93-4251-921A-013355153BF5/g, testGuid.value.toUpperCase())
                        .replace(/BD79C050-331F-4733-87DE-F650976253B5/g, starterKitGuid.value.toUpperCase())
                        .replace(/948E75FD-C478-4001-AFBE-4D87181E1BEC/g, integrationGuid.value.toUpperCase())
                        .replace(/0A3016FD-A06C-4AA1-A843-DEA6A2F01696/g, unitGuid.value.toUpperCase())
                        .replace(/http:\/\/localhost:51002/g, "http://localhost:" + kestrelHttpPort)
                        .replace(/http:\/\/localhost:51001/g, "http://localhost:" + iisHttpPort)
                        .replace(/"sslPort": 44300/g, "\"sslPort\": " + iisHttpsPort)
                        .replace(/--dataaccess-package--/g, dataProvider.package)
                        .replace(/--dataaccess-startupImports--/g, dataProvider.startupImports)
                        .replace(/--dataaccess-startupServices--/g, dataProvider.startupServices)
                        .replace(/.AddJsonFile("app.json")/g, dataProvider.startupCtor);
        return result;
      }
    };
     
     var source = this.sourceRoot();
     var dest = this.destinationRoot();
     var fs = this.fs;
     
     // copy files and rename starterkit to projectName
    
     console.log('Creation project skeleton...');
     
     nd.files(source, function (err, files) {
      for ( var i = 0; i < files.length; i++ ) {
        var filename = files[i].replace(/StarterKit/g, projectName)
                               .replace(/starterkit/g, lowerProjectName)
                               .replace('.npmignore', '.gitignore')
                               .replace(source.replace(/\\/g, '/'), dest.replace(/\\/g, '/'));
        // if (filename.indexOf('EntityContext.cs') > -1) {
        //   if (dataProvider.package === '')
        //     console.log("create-not EntityContext.cs");
        //   else
        //     fs.copy(files[i], filename, copyOptions);
        // }
        // else
         
        fs.copy(files[i], filename, copyOptions);

        // if (filename.indexOf('EntityContext.cs') > -1 || filename.indexOf('dataaccess.json') > -1 ) {
        //   if (dataProvider.package === '' )
        //     del.sync(filename, {force: true});
        // }
      }
    });

    //this.fs.delete(path.join('./src', projectName, 'DataAccess/EntityContext.cs'));
    //fs.delete('./src/Hello/DataAccess/EntityContext.cs');
  },

  // removeDir: function() {
  //   //this.fs.delete([path.join('./src', projectName, 'DataAccess/EntityContext.cs', './**/dataaccess.json', './**/dataaccess.json.dist']);
  //   this.fs.delete(path.join('./src', this.props.projectName, 'DataAccess/EntityContext.cs'));
  // },

  install: function () {
    // this.installDependencies();
    //this.log('----');
  }
});

function getDataProvider(input) {
  var dataProvider = { package: '', startupServices: '', startupImports: '', startupCtor: '.AddJsonFile("app.json")'};
  if (input.toLowerCase() === 'p') {
      dataProvider.package = '"Microsoft.EntityFrameworkCore": "1.0.0",\n"Npgsql.EntityFrameworkCore.PostgreSQL": "1.0.1",\n"Digipolis.DataAccess": "2.3.0",';
      dataProvider.startupServices = 'services.AddDataAccess<EntityContext>();\n' +
                                     '            var connection = @"Server=127.0.0.1;Port=5432;Database=TestDB;User Id=postgres;Password=postgres;";\n' +
                                     '            services.AddDbContext<EntityContext>(options => {\n' +
                                     '                options.UseNpgsql(connection);\n' +
                                     '                options.ConfigureWarnings(config => config.Throw(RelationalEventId.QueryClientEvaluationWarning));\n' +
                                     '            });';
      dataProvider.startupImports = 'using Microsoft.EntityFrameworkCore;\nusing Microsoft.EntityFrameworkCore.Infrastructure;\nusing Digipolis.DataAccess;';
      dataProvider.startupCtor = '.AddJsonFile("app.json")\n.AddJsonFile("dataaccess.json")';
  }
  else if (input.toLowerCase() === 's') {
      dataProvider.package = '"Microsoft.EntityFrameworkCore": "1.0.0",\n"Microsoft.EntityFrameworkCore.SqlServer": "1.0.0",\n"Digipolis.DataAccess": "2.3.0",';
      dataProvider.startupServices = 'services.AddDataAccess<EntityContext>();\n' +
                                     '            var connection = @"Server=127.0.0.1;Database=TestDB;User Id=sqlserver;Password=sqlserver;";\n' +
                                     '            services.AddDbContext<EntityContext>(options => {\n' +
                                     '                options.UseSqlServer(connection);\n' +
                                     '                options.ConfigureWarnings(config => config.Throw(RelationalEventId.QueryClientEvaluationWarning));\n' +
                                     '            });';
      dataProvider.startupImports = 'using Microsoft.EntityFrameworkCore;\nusing Microsoft.EntityFrameworkCore.Infrastructure;\nusing Digipolis.DataAccess;';
      dataProvider.startupCtor = '.AddJsonFile("app.json")\n.AddJsonFile("dataaccess.json")';
  };

  return dataProvider;
}

