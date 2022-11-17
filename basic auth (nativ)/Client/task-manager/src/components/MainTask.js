import React, {  useState } from 'react'
import ChildTask from './ChildTask'


function MainTask({props, items, addChildTask, updateTask, deleteTask}) {
    const[children, SetChildren] = useState(items.children)
    const task = items

    let hidden = true;
    
    const addChildren = (granted, t)=>{
        if(granted){
            let newChildren = [...children, t]
            SetChildren(newChildren)
        }

    }

    const AddChild = e=>{
        console.log(e.target.value);
        const newTask = document.getElementById("textinput"+ e.target.value)
        console.log("adding new child task:" + newTask.value);
        let t= {
            parent: task.id,
            value: newTask.value,
            done: false
        };
        addChildTask(t, addChildren);
        newTask.value = ""
    }

    const delTask = () =>{
        let newTask = task
        newTask.parent= "-1"
        deleteTask(newTask)
    }
    
    const updateChildrent = (canDelete, id) =>{
        let newChildren = children.filter(ch => {return ch.id !== id})
        SetChildren(newChildren)
    }

    const deleteChildTassk = (t)=>{
        // t.parent = task.id
        deleteTask(t,updateChildrent)
    }

    const hideChildren = () =>{
        const ele = document.getElementById("children"+task.id) 
        const parent = document.getElementById("task"+task.id)
        // const btn = document.getElementById("showbutton"+task.id)
        const pCont = document.getElementById("parenttask"+task.id)
        if (hidden){
            // btn.style.rotate = "180deg";
            // btn.style.translate = "0 15px"

            ele.classList.remove("children-hidden")
            ele.classList.add("children-visible")
            parent.classList.replace("clean-border", "messy-border")
            parent.classList.add("messy-border")
            parent.classList.remove("clean-border")
            pCont.style.height = "fit-content"

            hidden = false
        }else {
            // btn.style.rotate = "0deg";
            // btn.style.translate = "0"
            ele.classList.add("children-hidden")
            ele.classList.remove("children-visible")
            parent.classList.replace("messy-border", "clean-border")
            parent.classList.add("clean-border")
            parent.classList.remove("messy-border")

            hidden = true
        }
    }

    return (
    <div className='main-task mian-task-hidden' id={"parenttask"+task.id}>
        <div className='header clean-border' id={"task"+task.id}> 
            
            <h3> {task.name}</h3>
            <button className="delete-button" onClick={delTask}>X</button>
            <div className='drop-button' id={"showbutton"+task.id} onClick={hideChildren}> <h1>▲ </h1> </div>
            
            
        </div>
        
            <div id={"children"+task.id} className='children children-hidden'>
                {
                    children.map((c) => (
                        <ChildTask key={"child"+c.id} t={c} deleteTask={deleteChildTassk} />
                    ))

                        
                }
            <div className='user-input'>
                <input className='input-text' id={"textinput"+ task.id} type="text" ></input>
                <button className='submit-button' value={task.id} onClick={AddChild}> ↲</button> 
            </div>
            </div> 
        
        
    </div>
  )
}

export default MainTask