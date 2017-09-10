(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.queryRouter = factory());
}(this, (function () { 'use strict';

var Methods = {
    /**
     * Charse valid in folder
     */
    chars : (
        ['', 'w', 'd', 't', 's', 'n', '-','_', ',', '.', ':', "'", '"', '@', '#', '(', ')', '[', '{', '}', '=']
    ).join('\\'),
    /**
     * generates a regular expression to retrieve parameters
     * @example /param(arg1,arg2,...argInfinite)
     * @param  {string} parse 
     * @return {object} {replace,params}
     */
    param: function param(parse){
        var this$1 = this;

        var params  = [],
            replace = parse.split(',')
                           .map( function (arg){ return (
                               arg
                               .replace(/(.+)\?$/g,function (patt,param){
                                   params.push(param);
                                   return ("(?:(?:/)([" + (this$1.chars) + "]+)){0,1}")
                               })
                               .replace(/\.\.\.(.+)/,function (patt,param){
                                   params.push(param);
                                   return "(?:(?:/)(.+)){0,1}"
                               })
                               .replace(/^(\w+)/g,function (patt,param){
                                   params.push(param);
                                   return ("(?:(?:/)([" + (this$1.chars) + "]+)){1}")
                               })
                           ); })
                           .join('');
        return {replace: replace,params: params};
    },
    /**
     * Checks if the content does not match the string delivered as the first argument
     * @example /not(hello|bye,<optional label for param>)
     * @param {string} patt 
     * @return {object} {replace,params}
     */
    not: function not(parse,option){
        var label = '';
        parse = RegExp(
            '(^('+
            parse.replace(/\,(.+)/,function (patt,name){
                label = name.replace(/\?$/,function (){
                    option = true;
                    return '';
                });
                return '';
            })
            +')$)'
        );
        return {
            replace : ("(?:(?:/)([" + (this.chars) + "]+)){" + (option?'0,1':'1') + "}"),
            params  : [function (value){ return ({
                label: label,
                value: value,
                unsave : label ? false : true,
                rejected : parse.test(value),
            }); }]
        }
    },
    any: function any(parse,join){
        var this$1 = this;

        var replace = parse.replace(/(\*)/g,function (all,any){
            join = true;
            return ("[" + (this$1.chars) + "]");
        });
      
        return {
            replace : '(?:\/)'+(join ? replace : ("[" + (this.chars) + "]"))+'+',
            param   : [],
        }
    }
};

var History = function History(type){
    if ( type === void 0 ) type='popstate';

    this.notify = [];
    this.type   = type;
    this.unlistener = [];
    this.start();
};
History.prototype.getPath = function getPath (){
    return ( location.pathname + location.hash + location.search ).replace(/\#(?!\/)/,'#/');
};
History.prototype.subscribe = function subscribe (callback){
    this.notify.push( callback );
    callback( this.path );
};
History.prototype.unsubscribe = function unsubscribe ( callback ){
    var notify = this.notify;
    notify.splice(
        notify.indexOf( callback ) >>> 0 , 1
    );
};
History.prototype.listener = function listener (type,callback){
    window.addEventListener(type,callback);
    return function (){ return window.removeEventListener( type, callback); };
};
History.prototype.update = function update (){
    var path = this.getPath();
    if( this.path !== path ){
        this.path = path;
        this.notify.forEach(function (callback){ return callback(path); });
    }
};
History.prototype.listenerHistory = function listenerHistory (){
        var this$1 = this;

    return this.listener(this.type,function (){ return this$1.update(); });
};
History.prototype.listenerClick = function listenerClick (){
        var this$1 = this;

    return this.listener('click',function (event){
        var parent = event.target;
        while(parent){
            if( !parent ) { break; }
            if( 'href' in parent ){
                var href =  parent.getAttribute('href');

                if( ! /^(http(s){0,1}\:|\/\/)/.test(href) ){
                    event.preventDefault();
                    this$1.redirect(
                        parent.getAttribute('href')
                    );
                }
                break
            }
            parent = parent.parentElement;
        }
    })
};
History.prototype.start = function start (){
    this.path = this.getPath();
    this.unlistener.push(
        this.listenerClick(),
        this.listenerHistory()
    );
};
History.prototype.stop = function stop (){
    this.unlistener = this.unlistener.filter(function (callback){
        callback();
        return false;
    });
};
History.prototype.redirect = function redirect ( path, propagation ){
        if ( propagation === void 0 ) propagation = true;

    if( this.path !== path ){
        history.pushState( {page:path},'',path )   ;
        if( propagation ){
            var event = document.createEvent('Event');
                        event.initEvent(this.type, true, true);
                        window.dispatchEvent(event);
        }
    }
};

var FN_MATCH = /(\w+)\((.+){0,}\)/g;

var Parse = function Parse(path){
    this.toRegExp( path );
};
Parse.prototype.toRegExp = function toRegExp ( path ){
    var params  = [];
    this.path   = path.replace(/[\s]/g,'').replace(/([\n\t]+|\/)/g,'/');
    this.regExp = path instanceof RegExp ? path : RegExp(
        '^'+ 
        this.path
        .split(/\//)
        .filter(function (folder){ return folder; })
        .map(function (folder){
            if( FN_MATCH.test(folder) ){
                return folder.replace(FN_MATCH,function (patt,method,parse){
                    if( Methods[method] ){
                        var format = Methods[method](parse||'');
                        params = params.concat(format.params);
                        return format.replace || ''; 
                    }else{
                        return '';
                    }
                })
            }else{
                return ("(?:/)(?:" + (folder.replace(/\./g,'\\.')) + "){1}");
            }
        })
        .join('')+'(?:\/){0,1}$','i'
    );
    this.params = params;
};
Parse.prototype.match = function match ( path, filter ){
        var this$1 = this;
        if ( filter === void 0 ) filter = {};

    var test = String(path).match( this.regExp ),rejected,params = {};
    if( test ){
        test
        .slice(1)
        .some(function (value,index){
            var unsave = false;
            if( this$1.params[ index ] ){
                var cursor = this$1.params[index];
                if( typeof cursor == 'function' ){
                    var response = cursor( value );
                    rejected = response.rejected;
                    value= response.value;
                    index= response.label||index;
                    unsave   = response.unsave;

                }else { index = cursor; }
            }
                
            if(!unsave) { params[ index ] = filter[index] ? 
                                         filter[index](value,function (){ return rejected=true; }):
                                         value; }
            return rejected;
        });
    }

    return test ? ( rejected ? false : params ) : false;
};

var Router = function Router(paths){
    if ( paths === void 0 ) paths = {};

    this.paths = paths;
    this.recall = [];
};
Router.prototype.on = function on (path,inside,outside){
    var group = {inside: inside,outside: outside},
        target = (
            this.paths[path] = this.paths[path] || {
                notify : [],
                parse  : new Parse(path)
            }
        );
        target.notify.push(group);
    return function (){
        target.splice(
            target.indexOf( group )>>>0,1
        );
    }
};
Router.prototype.each = function each (callback){
        var this$1 = this;

    for( var key in this$1.paths ) { callback(this$1.paths[key],key); }
};
Router.prototype.getSearchParams = function getSearchParams (path){
    var search = {};
    path = path.replace(/\?(.+)/,function (all,query){
        query.split('&').forEach(function (part){
            var ref = part.split('=');
                var index = ref[0];
                var value = ref[1];
            search[index] = value;
        });
        return '';
    });
    return {
        search: search,
        path: path
    }
};
Router.prototype.redirect = function redirect (path,from){
        var this$1 = this;

    if(typeof path === 'function'){
        path(function (path){ return this$1.redirect( path ); });
        return;
    }
    this.recall.forEach(function (item){
        item.notify.forEach(function (item){ return item.outside && item.outside(); });
    });
    this.recall = [];
    var exists;
        var ref = this.getSearchParams(path);
        var path = ref.path;
        var search = ref.search;
    this.each(function (item){
        var match = item.parse.match( path );
        if( match ){
            exists = true;
            match.redirect = from;
            match.search   = search;
            item.notify.forEach(function (item){
                item.inside && item.inside( match );
            });
            this$1.recall.push( item );
        }
    });

    !exists && path !== '/404' && this.redirect( '/404', path );
};

var index = {
    Methods: Methods,
    History: History,
    Router: Router,
    Parse: Parse
};

return index;

})));
