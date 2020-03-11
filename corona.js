console.log('corona.js loaded')

corona={}
corona.ui=(div=document.getElementById('coronaDiv'))=>{
    if(typeof(div)=='string'){
        div=document.getElementById(div)
    }
    if(typeof(div)!='object'){
        warning('div not found')
    }else{
        corona.div=div
    }
}

if(typeof(define)!=='undefined'){
    define(corona)
}