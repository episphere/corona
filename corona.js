console.log('corona.js loaded');

corona={}
corona.ui=(div=document.getElementById('coronaDiv'))=>{
    if(typeof(div)=='string'){
        div=document.getElementById(div)
    }
    if(typeof(div)!='object'){
        warning('div not found')
    }else{
        div.innerHTML='cororaDiv here ...'
        corona.div=div
    }
}

if(typeof(define)!='undefined'){
    define(corona)
}

corona.getDaily=async(day)=>{
    let url=`https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_daily_reports/03-03-2020.csv`
    return fetch('https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_daily_reports/03-03-2020.csv').then(response => response.text()).then(data => console.log(data));
}


//https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_daily_reports/03-03-2020.csv