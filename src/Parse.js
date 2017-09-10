
import Methods from './Methods';

export const FN_MATCH = /(\w+)\((.+){0,}\)/g;

export default class Parse{
    constructor(path){
        this.toRegExp( path );
    }
    toRegExp( path ){
        let params  = [];
        this.path   = path.replace(/[\s]/g,'').replace(/([\n\t]+|\/)/g,'/')
        this.regExp = path instanceof RegExp ? path : RegExp(
            '^'+ 
            this.path
            .split(/\//)
            .filter(folder=>folder)
            .map(folder=>{
                if( FN_MATCH.test(folder) ){
                    return folder.replace(FN_MATCH,(patt,method,parse)=>{
                        if( Methods[method] ){
                            let format = Methods[method](parse||'');
                            params = params.concat(format.params);
                            return format.replace || ''; 
                        }else{
                            return '';
                        }
                    })
                }else{
                    return `(?:\/)(?:${folder.replace(/\./g,'\\.')}){1}`;
                }
            })
            .join('')+'(?:\/){0,1}$','i'
        );
        this.params = params;
    }
    match( path, filter = {} ){
        let test = String(path).match( this.regExp ),rejected,params = {};
        if( test ){
            test
            .slice(1)
            .some((value,index)=>{
                let unsave = false;
                if( this.params[ index ] ){
                    let cursor = this.params[index];
                    if( typeof cursor == 'function' ){
                        var response = cursor( value );
                        rejected = response.rejected;
                        value    = response.value;
                        index    = response.label||index;
                        unsave   = response.unsave;

                    }else index = cursor;
                }
                
                if(!unsave) params[ index ] = filter[index] ? 
                                             filter[index](value,()=>rejected=true):
                                             value;
                return rejected;
            })
        }

        return test ? ( rejected ? false : params ) : false;
    }
}
