import Parse from './Parse';

export default class Router{
    constructor(paths = {}){
        this.paths = paths;
        this.recall = [];
    }
    on(path,inside,outside){
        let group = {inside,outside},
            target = (
                this.paths[path] = this.paths[path] || {
                    notify : [],
                    parse  : new Parse(path)
                }
            );
            target.notify.push(group);
        return ()=>{
            target.splice(
                target.indexOf( group )>>>0,1
            );
        }
    }
    each(callback){
        for( let key in this.paths ) callback(this.paths[key],key);
    }
    getSearchParams(path){
        let search = {};
        path = path.replace(/\?(.+)/,(all,query)=>{
            query.split('&').forEach((part)=>{
                var [index,value] = part.split('=');
                search[index] = value;
            })
            return '';
        })
        return {
            search,
            path
        }
    }
    redirect(path,from){
        if(typeof path === 'function'){
            path((path)=>this.redirect( path ))
            return;
        }
        this.recall.forEach((item)=>{
            item.notify.forEach(item=>item.outside && item.outside())
        })
        this.recall = [];
        var exists,{path,search} = this.getSearchParams(path);
        this.each((item)=>{
            let match = item.parse.match( path );
            if( match ){
                exists = true;
                match.redirect = from;
                match.search   = search;
                item.notify.forEach((item)=>{
                    item.inside && item.inside( match );
                });
                this.recall.push( item );
            }
        })

        !exists && path !== '/404' && this.redirect( '/404', path );
    }
}