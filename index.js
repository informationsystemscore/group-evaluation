// works with the spreadsheet named group evals owned by unformationsystemscore
const gas_deployment_id='AKfycbxO26Rq2jQob1-R-vWkm6gU8YOYzhM_71rnUqxrzrVf1ZGwhe1Guhdu24h9g9W5YiYL'
const gas_end_point = 'https://script.google.com/macros/s/'+gas_deployment_id+'/exec'


evaluation='<select name="a"><option value=1>1-Much less<br>than average</option><option value=2>2</option><option value=3>3-About average</option><option value=4>4</option><option value=5>5-Much more than average</option>'
let team
let survey
function fill_random(){
    let x=0
    for(const s of survey.questionnaire){
        for(const q of s.questions  ){
            
            const rows = document.getElementsByTagName("table")[x++].rows;

            for(let r=1;r< rows.length;r++){
                const row = rows[r]
                const random_number=randBetween(1,5)
                //console.log(row.children.length,random_number, row.children[random_number])
                row.children[random_number].children[0].checked=true
            }
        }
    }
    document.getElementById("comment").value="This survey was randomly generated"
}

async function configure(raw_netid){
    const netid = raw_netid.trim().toLowerCase()
    document.getElementById("netid").style.display="none"
    document.getElementById("waiting").style.display="block"
    survey=await server_request({netid:netid})
    document.getElementById("waiting").style.display="none"
    if(survey.status==="error"){
        // bad net id
        document.getElementById("netid").style.display="block"
        document.getElementById("message").innerHTML=survey.message
        return
    }
    document.getElementById("body").style.display="block"
    //const params = atob(window.location.search.substr(1)).split("|")
    document.getElementById("title").innerHTML=survey.title
    document.getElementById("form_title").value=survey.title
    document.getElementById("student_netid").value=netid
    
    team=[survey.group[netid]]
    for(const[key,val] of Object.entries(survey.group)){
        if(key!==netid){
        team.push(val)
        }
    }
    
    document.getElementById("student_name").innerHTML = survey.group[netid]
    document.getElementById("student_name2").innerHTML = survey.group[netid]
    


    

    //interate labels into survey.questionnaire
    for(const qs of survey.questionnaire){
        for(const q of qs.questions){
            q.labels = survey.labels[q.labels]
        }
    }
    console.log("===========================================")
    console.log("survey.questionnaire", survey.questionnaire)

    
    for(let q=0;q<survey.questionnaire.length;q++){
        const question_set = survey.questionnaire[q]
        const newdiv=document.createElement("div")
        newdiv.className="header"
        newdiv.innerHTML="<h2>" + question_set.header + "</h2>"
        document.getElementById("evals").appendChild(newdiv);

        for(let e=0; e < question_set.questions.length; e++){
            const question = question_set.questions[e]
            const table=document.createElement('table')
            const row=table.insertRow() 
            const row_html=['<th class="first-col"></th>']
            for(const label of question.labels){
                if(label){
                    row_html.push("<th>" + label + "</th>")
                }else{
                    row_html.push("<th></th>")
                }
            }
            row.innerHTML=row_html.join("")
            for(let i=team.length-1;i>-1;i--){
            
                const row  = table.insertRow()
                row.className="normal"
                row.id=`row${i}q${q}e${e}`
                let suffix=""
                if(i===0){suffix=" (you)"}
    
                row.innerHTML=` <td class="first-col">${team[i]}${suffix}</td>
                <td><input type="radio" value="1" name="tm${i}q${q}e${e}" /></td>
                <td><input type="radio" value="2" name="tm${i}q${q}e${e}" /></td>
                <td><input type="radio" value="3" name="tm${i}q${q}e${e}" /></td>
                <td><input type="radio" value="4" name="tm${i}q${q}e${e}" /></td>
                <td><input type="radio" value="5" name="tm${i}q${q}e${e}" /></td>`
            }
    
            const evals=document.getElementById("evals")
            const newdiv=document.createElement("div")
            newdiv.innerHTML=`
                <h3><span class="emphasis">${question.text}</span>.</h3>
            `
            evals.appendChild(newdiv);
            evals.appendChild(table);
        }


    }

            // end of rendering survey   
          



}

function submit_form(){
    const data={}
    let message=null
    let data_comment

    for(let i=0;i<survey.questionnaire.length;i++){
        const qs = survey.questionnaire[i]
        data[qs.header] = {}
        for(let j=0;j<qs.questions.length;j++){
            const q = qs.questions[j]
            data[qs.header][q.text]={}
            for(let k=0;k<team.length;k++){
                const tm = team[k]

                if (window.event.ctrlKey) {
                    //for debugging
                    data[qs.header][q.text][tm]=randBetween(1,5)
                }else{
                    data[qs.header][q.text][tm]=null
                }

                // settign the value by scanning the radio buttons
                for(const btn of document.getElementsByName(`tm${k}q${i}e${j}`)){
                    if(btn.checked){
                        data[qs.header][q.text][tm]=parseInt(btn.value)
                        document.getElementById(`row${k}q${i}e${j}`).className="normal"
                    }
                }

                if(data[qs.header][q.text][tm]===null){
                    message="Please complete all evaluations"
                    document.getElementById(`row${k}q${i}e${j}`).className="error"
                }
            }
        }
    }

     console.log("data", data)
    // return false


    if(message){
        alert(message)
        return false
    }
    if(document.getElementById("comment").value){
      data_comment=document.getElementById("comment").value
    }else{  
        data_comment=""
    }
   //console.log ("data",data)
   document.getElementById("stud_name").value = team[0]
   document.getElementById("comment2").value = data_comment
   document.getElementById("data").value = JSON.stringify(data)
    return true
    
    
}

function randBetween(min, max) { // min and max included 
    return Math.floor(Math.random() * (max - min + 1) + min)
  }


async function server_request(payload, callback){
    //This function is used to invoke a function in Google App Script.
    //if a callback is not provided  this function waits until the call is complete
    
    console.log("const payload=`" + JSON.stringify(payload) + "`")//This is primarily useful for troubleshooting. The data passed to Google App Script is sent to the console.
    //The request for Google App Script is formatted.
    const options = { 
        method: "POST", 
        body: JSON.stringify(payload),
    }

    if(callback){// execute the requst and let callback handle the response
        fetch(gas_end_point, options)
        .then(response => response.json())
        .then(callback);
    }else{ //execute the request and wait for the response so it can be returned
        const reply = await fetch(gas_end_point, options)
        //The request is made of Google App Script and the response is set to "response"
        const response = await reply.json()

        if(response.error){
            // we trapped an error in the google apps script
            console.error("Error in Google Apps Script")
            throw response.error

        }
        console.log("in post data", response)     

        return response
    }
}
