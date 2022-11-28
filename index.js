evaluation='<select name="a"><option value=1>1-Much less<br>than average</option><option value=2>2</option><option value=3>3-About average</option><option value=4>4</option><option value=5>5-Much more than average</option>'
let team
const questionnaire = []

function configure(){
    const params = atob(window.location.search.substr(1)).split("|")
    document.getElementById("title").innerHTML=params[3]
    document.getElementById("form_title").value=params[3]
    document.getElementById("netid").value=params[0]
    team=params[1].split(",")
    document.getElementById("student_name").innerHTML = team[0]
    

    // remove null from the team.  Null is used because normal team size is 4, but when a team member drops the core, it is easier to substitute with null rather than reduce teh call to only 3 team members 
    for(let i=team.length-1;i>-1;i--){
        if(team[i].replace(/ /g, '')==="null"){
            team.splice(i, 1)
        }
    }

   
    console.log("params",params)
    const promises=[]
    //get question sets
    for(const qset of params[2].split(",")){
        promises.push(
            fetch("https://byuis.github.io/forms/group_evals/question_sets/" + qset + ".json?" + new Date().getTime())
            .then(response => response.json())
            .catch(error => {
                console.log("error",error)
            })
        )
    
    }

    const label_promises = []
    const labels=[]
    const question_labels={}
    Promise.all(promises).then((question_sets) => {
        //now we have the question sets, get the labels
        for(const question_set of question_sets){
            questionnaire.push(question_set)
            console.log(question_set.header)
            for(const question of question_set.questions){
                console.log(question)   
                if(!labels.includes(question.labels)){
                    labels.push(question.labels)
                    question_labels[question.labels]=null
                    label_promises.push(
                        fetch("https://byuis.github.io/forms/group_evals/labels/" + question.labels + ".json?" + new Date().getTime())
                        .then(response => response.json())
                        .catch(error => {
                            console.log("error",error)
                        })
                    )
                }     
            }
        }
        // now we have requested all the labels
        Promise.all(label_promises).then((labels_data) => {
            for(let i=0; i<labels_data.length;i++){
                question_labels[labels[i]]=labels_data[i]
            }
            // now we have the labels, ready to render            

            //interate labels into questionnaire
            for(const qs of questionnaire){
                for(const q of qs.questions){
                    q.labels = question_labels[q.labels]
                }
            }
            console.log("===========================================")
            console.log("Questionnaire", questionnaire)
    
           
            for(let q=0;q<questionnaire.length;q++){
                const question_set = questionnaire[q]
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
        });     
    });


}

function submit_form(){
    const data={}
    let message=null
    let data_comment

    for(let i=0;i<questionnaire.length;i++){
        const qs = questionnaire[i]
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
    }else if(window.event.ctrlKey){
        //for debugging
        const comment = []
        for(let i=team.length-1;i>0;i--){
            comment.push(team[i].split(" ")[0])
            comment.push(", ")
        }
        comment[comment.length-3]=", and "
        comment[comment.length-1]=" were really great to work with.  I can't imagine a better group.  Please keep us together next semester!!!"
        data_comment=comment.join("")
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

