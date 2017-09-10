
export default class History{
    constructor(type='popstate'){
        this.notify     = [];
        this.type       = type;
        this.unlistener = [];
        this.start();
    }
    getPath(){
        return ( location.pathname + location.hash + location.search ).replace(/\#(?!\/)/,'#/');
    }
    subscribe(callback){
        this.notify.push( callback );
        callback( this.path );
    }
    unsubscribe( callback ){
        let notify = this.notify;
        notify.splice(
            notify.indexOf( callback ) >>> 0 , 1
        );
    }
    listener(type,callback){
        window.addEventListener(type,callback);
        return ()=>window.removeEventListener( type, callback);
    }
    update(){
        let path = this.getPath();
        if( this.path !== path ){
            this.path = path;
            this.notify.forEach(callback=>callback(path));
        }
    }
    listenerHistory(){
        return this.listener(this.type,()=>this.update());
    }
    listenerClick(){
        return this.listener('click',(event)=>{
            let parent = event.target;
            while(parent){
                if( !parent ) break;
                if( 'href' in parent ){
                    let href =  parent.getAttribute('href');

                    if( ! /^(http(s){0,1}\:|\/\/)/.test(href) ){
                        event.preventDefault();
                        this.redirect(
                            parent.getAttribute('href')
                        );
                    }
                    break
                }
                parent = parent.parentElement;
            }
        })
    }
    start(){
        this.path = this.getPath();
        this.unlistener.push(
            this.listenerClick(),
            this.listenerHistory()
        )
    }
    stop(){
        this.unlistener = this.unlistener.filter((callback)=>{
            callback()
            return false;
        })
    }
    redirect( path, propagation = true ){
        if( this.path !== path ){
            history.pushState( {page:path},'',path )   ;
            if( propagation ){
                let event = document.createEvent('Event');
                            event.initEvent(this.type, true, true);
                            window.dispatchEvent(event);
            }
        }
    }
}