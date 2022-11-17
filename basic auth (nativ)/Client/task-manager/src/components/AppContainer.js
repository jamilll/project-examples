import React, { useState, useEffect } from 'react'
import LoginContainer from './LoginContainer'
import TaskContainer from './TaskContainer'


function AppContainer() {

    const [tasks, setTasks] = useState([])

    // used to authenticate session bc chrome does not allow "set-cookie"

    const [sessionToken, setSessionToken] = useState("empty")


    const SERVERURL = "http://192.168.0.101:8080"

    const x = async function (){
        
        const st = {
            method: "get"
        }

        fetch('http://192.168.0.101:8080/', st )
        .then(res => res.json())
        .then(d =>{
           let newTasks = []
            d.forEach(e => {
                let ts = {
                    name: e.value,
                    done: e.done,
                    id: e.id
                }
                // root task
                if(e.parent==="-1"){
                    ts.children = []
                    newTasks.push(ts)
                } else{
                    // add child to parent
                    newTasks.forEach(ele =>{
                        if(ele.id === e.parent){
                            ele.children.push(ts)
                            
                        }
                    })
                }
            });

            setTasks(newTasks)
        })
           
       }

       
       useEffect(()=>{
        try{
            x()

        } catch(e){
            console.log(e);
        }
       }, [])
   

    
    // Send Login request to server and update the tasks on success
    const login = (s)=>{
        
        const req = {
            method: "POST",
            headers:{
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                'username': s.username,
                'password': s.password
            })
                
        }   

        fetch("http://192.168.0.101:8080/login",  req)
        .then(res =>
            res.json()
        
        
        )
        .then(d =>{
            console.log(d);
            // unauthorized
            if (d.value === "0"){
                console.log("invalid username/password");
                return;
            }

            // Set session token
            // document.cookie = "session_token="+ d.value
            //save the session token for later
            setSessionToken(d.value)
            // typeof(d.value)
            console.log("new session token"+ sessionToken+ " with type: " +typeof(d.value));

            // user has no tasks
            if(d.tasks == null) {
                switchButton();
                setTasks([])
                return;
            }
            let newTasks = []
             d.tasks.forEach(e => {
                 let ts = {
                     name: e.value,
                     done: e.done,
                     id: e.id
                 }
                 // root task
                 if(e.parent==="-1"){
                     ts.children = []
                     newTasks.push(ts)
                 } else{
                     // add child to parent
                     newTasks.forEach(ele =>{
                         if(ele.id === e.parent){
                             ele.children.push(ts)
                             
                         }
                     })
                 }
             });
 
            setTasks(newTasks)
            switchButton()
         })

    }

    const addRootTask = (t, update) =>{
        
        console.log("adding new task with session token: " + sessionToken);

        const req = {
            method: "POST",
            headers:{
                "session_token": sessionToken
            },
            withCredentials: true,
            credential: "same-origine",

            body: JSON.stringify(t)
        }


        fetch("http://192.168.0.101:8080/addtask",  req)
        .then(res => res.json())
        .then(e =>{
            console.log(e);
            // failed to add task
            if(e.id === "-1"){
                return;
            }
            // set new session token
            setSessionToken(e.value)

            t.name = t.value

            // Root task
            if (t.parent === "-1"){
                t.id = e.id;
                t.children = []
                console.log("adding root task");
                console.log(t);
                let newTasks = [t, ...tasks]
                setTasks(newTasks)
                return
            } 

            // child task
            t.id = e.id
            update(true, t)
            // let newTasks = []
            // tasks.forEach(ts =>{
            //     if(ts.id === t.parent){
            //         let newTs = ts
            //         newTs.id = e.id;
            //         newTs.children.push(t)
            //         console.log("new child task");
            //         console.log(newTs);
            //         newTasks.push(newTs)
            //     }else{
            //         newTasks.push(ts)
            //     }
            // })
            // h=true
            // setTasks(newTasks)
        
                
            
        })


    }

    const deleteTsak= (t, update) =>{
        console.log("deleting task");
        console.log(t);

        const req = {
            method: "POST",
            headers:{
                "session_token": sessionToken
            },
            withCredentials: true,
            credential: "same-origine",

            body: JSON.stringify(t)
        }


        fetch("http://192.168.0.101:8080/removetask",  req)
        .then(res => res.json())
        .then(e => {
            // deletion success 
            if(e.id !== "1"){
                return
            }
            // root task
            if(t.parent === "-1"){
                let newtasks = tasks.filter(i =>{
                    return i.id !== t.id
                })
                setTasks(newtasks)
            }else {
                update(true, t.id)
                
            }

            setSessionToken(e.value)
        })


    }


    // Login and Logout section

    let h = false
    const switchButton = () =>{
        const tc = document.getElementById("task-container")
        const lc = document.getElementById("login-container")
        if(!h){
            tc.classList.add("task-container-hide")
            tc.classList.remove("task-container-show")
            lc.classList.add("login-show")
            lc.classList.remove("login-hide")
            h = true
        } else {
            tc.classList.remove("task-container-hide")
            tc.classList.add("task-container-show")
            lc.classList.remove("login-show")
            lc.classList.add("login-hide")

            h = false


        }
    }



    return (
        <div className='main-container'>
                  <button className='switch' onClick={switchButton}> ⇄ </button>

            <h1> Tasks</h1>
            <LoginContainer login={login} />
            <TaskContainer taskList={tasks} rootTask={addRootTask} deleteTask={deleteTsak} />            
        </div>
    )
}

export default AppContainer