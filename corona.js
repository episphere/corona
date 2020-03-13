console.log('corona.js loaded');

corona={
    daily:{} // daily results cached here
}
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

corona.getDaily=async(dayString=corona.formatDate(new Date(Date.now()-(24*60*60*1000))))=>{ // default will call with data string from previous day
    let url=`https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_daily_reports/${dayString}.csv`
    corona.daily[dayString]=await corona.getJSONdaily(url)
    return corona.daily[dayString]
}

corona.getJSONdaily=async(url)=>{
    let txt= await (await fetch(url)).text()
    if(txt.slice(-1).match(/[\s\n]/)){
        txt=txt.slice(0,-1)
    }
    txt=txt.replace('"Korea, South"','South Korea') // wrangling
    let arr = txt.split(/\n/g).map(x=>x.split(','))
    // create dataframe
    let labels = arr[0]
    let J={}
    labels.forEach(L=>{
        J[L]=[]
    })
    arr.slice(1).forEach((r,i)=>{
        r.forEach((v,j)=>{
            J[labels[j]][i]=v
        })
    })
    // clean each variable
    J["Last Update"]=J["Last Update"].map(v=>new Date(v)) // time
    labels.slice(3).forEach(L=>{
        J[L]=J[L].map(v=>parseFloat(v))
    })
    return J
}

corona.formatDate=(x=new Date())=>{
    var y = x.getFullYear().toString();
    var m = (x.getMonth() + 1).toString();
    var d = x.getDate().toString();
    (d.length == 1) && (d = '0' + d);
    (m.length == 1) && (m = '0' + m);
    return `${m}-${d}-${y}`
}


if(typeof(define)!='undefined'){
    define(corona)
}


//https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_daily_reports/03-03-2020.csv