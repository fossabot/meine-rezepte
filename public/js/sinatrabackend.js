function SinatraBackend(){
    this.datastore;
    var self = this;

    this.init = function(app){
        if (typeof(config) == 'undefined') {
            msg  = "You need the config. Create a file 'public/js/config.js'.\n"
            msg += "And add the endpoint to the sinatra backend.\n"
            bootbox.alert(msg);
        } else {
            self.config = config;
            if (!$.cookie('email')){
                app.getEmailPasswort(function(email, password){
                    self.login(email, password, app.run);
                });
            } else {
                app.run();
            }
        }
    };

    this.sendRequest = function(method, path, success_callback, data, addional_options){
        var options = {
            method: method,
            url: self.config.endpoint + path,
            crossDomain: true,
            beforeSend: function(xhr) {
                xhr.setRequestHeader('Authorization', 'Basic ' + btoa($.cookie('email') + ':' + $.cookie('password')));
            },
            success: success_callback
        };
        if (data != undefined){
            options.data = data;
        }
        if (addional_options != undefined){
            options = {...options, ...addional_options};
        }

        $.ajax(options).fail(function(error) {
            if (typeof error_callback === "function") {
                error_callback();
            } else {
                console.log(error);
                bootbox.alert("An error occured: " + error.status + ' ' + error.statusText);
            }
        });
    };

    this.login = function(email, password, callback){
        $.get({
            url: self.config.endpoint + '/recipe',
            crossDomain: true,
            beforeSend: function(xhr) {
                xhr.setRequestHeader('Authorization', 'Basic ' + btoa(email + ':' + password));
            },
            success: function(data, state, xhr){
                $.cookie('email', email, {expires: 365});
                $.cookie('password', password, {expires: 365});
                callback();
            }
        })
        .fail(function(error) {
            bootbox.alert("An error occured: " + error.status + ' ' + error.statusText);
        });
    };

    this.exportRecipes = function(finishedCallback){
        self.sendRequest('GET', '/recipe/', function(data){
            finishedCallback(data);
        });
    };

    this.getRecipesTitles = function(finishedCallback){
        var titles = new Array();
        self.sendRequest('GET', '/recipe/', function(data){
            data.forEach(function(recipe){
                titles.push(recipe.title);
            });
            finishedCallback(titles);
        });
    };

    this.getRecipesByTitle = function(titleStartWith, itemCallback, finishedCallback){
        self.sendRequest('GET', '/recipe/?titleStart=' + titleStartWith, function(data){
            data.forEach(function(recipe){
                itemCallback(recipe);
            });
            finishedCallback();
        });
    };

    this.searchRecipeByTitle = function(title, itemCallback, notFoundCallback){
        self.sendRequest('GET', '/recipe/?title=' + btoa(title), function(recipe){
            if (recipe) {
                itemCallback(recipe);
            } else {
                notFoundCallback();
            }
        });
    }

    this.getRecipe = function(recipeId, itemCallback){
        self.sendRequest('GET', '/recipe/' + recipeId, function(recipe){
            itemCallback(recipe);
        });
    };

    this.addRecipe = function(title, description, content, itemCallback){
        if (title == undefined || title.length == 0) {
            return false;
        }
        var data = {
            'title': title,
            'description': description,
            'content': content
        }
        self.sendRequest('POST', '/recipe/', function(recipe){
            itemCallback(recipe);
        }, data);
    };

    this.updateRecipe = function(recipeId, title, description, content, itemCallback){
        if (title == undefined || title.length == 0) {
            return false;
        }
        var data = {
            'title': title,
            'description': description,
            'content': content
        }
        self.sendRequest('PUT', '/recipe/' + recipeId, function(recipe){
            itemCallback(recipe);
        }, data);
    };

    this.deleteRecipe = function(recipeId, itemCallback){
        self.sendRequest('DELETE', '/recipe/' + recipeId, function(recipe){
            itemCallback(recipe);
        });
    }

    this.uploadPicture = function(recipeId, picture, itemCallback){
        var fd = new FormData();
        fd.append('upload', picture, 'picture');
        options = {
            processData: false,
            contentType: false
        }

        self.sendRequest('POST', '/recipe/' + recipeId + '/picture', function(recipe){
            itemCallback(recipe);
        }, fd, options);
    };

    this.deletePicture = function(recipeId, picturePath, itemCallback){
        self.sendRequest('DELETE', '/recipe/' + recipeId + '/picture/' + btoa(picturePath), function(recipe){
            itemCallback(recipe);
        });
    };
}