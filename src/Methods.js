export default {
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
    param(parse){
        let params  = [],
            replace = parse.split(',')
                           .map( arg=>(
                               arg
                               .replace(/(.+)\?$/g,(patt,param)=>{
                                   params.push(param)
                                   return `(?:(?:\/)([${this.chars}]+)){0,1}`
                               })
                               .replace(/\.\.\.(.+)/,(patt,param)=>{
                                   params.push(param);
                                   return `(?:(?:\/)(.+)){0,1}`
                               })
                               .replace(/^(\w+)/g,(patt,param)=>{
                                   params.push(param);
                                   return `(?:(?:\/)([${this.chars}]+)){1}`
                               })
                           ))
                           .join('')
        return {replace,params};
    },
    /**
     * Checks if the content does not match the string delivered as the first argument
     * @example /not(hello|bye,<optional label for param>)
     * @param {string} patt 
     * @return {object} {replace,params}
     */
    not(parse,option){
        let label = '';
        parse = RegExp(
            '(^('+
            parse.replace(/\,(.+)/,(patt,name)=>{
                label = name.replace(/\?$/,()=>{
                    option = true;
                    return '';
                })
                return '';
            })
            +')$)'
        );
        return {
            replace : `(?:(?:\/)([${this.chars}]+)){${option?'0,1':'1'}}`,
            params  : [(value)=>({
                label,
                value,
                unsave : label ? false : true,
                rejected : parse.test(value),
            })]
        }
    },
    any(parse,join){
        let replace = parse.replace(/(\*)/g,(all,any)=>{
            join = true;
            return `[${this.chars}]`;
        })
      
        return {
            replace : '(?:\/)'+(join ? replace : `[${this.chars}]`)+'+',
            param   : [],
        }
    }
}