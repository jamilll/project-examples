import React, { useState } from 'react'
import MainTask from './MainTask'

// Contains all main tasks
// Has to call API to init values
function TaskContainer({taskList, rootTask, deleteTask}) {

    const addRootTask = () =>{
        const ts = document.getElementById("root-task").value;
        console.log(ts);
        let t  ={
            parent: "-1",
            value: ts,
            done: false
        }
        rootTask(t)
    }

    return (
        <div className='task-container task-container-show' id="task-container">
            <div className='main-input'>
                <input type="text" id='root-task' />
                <button className='main-input-button' onClick={addRootTask}> +</button>
            </div>
            <div id='tasks'>
                {
                    taskList.map((e) =>(
                            <MainTask 
                            addChildTask={rootTask}
                            items={e}
                            key={"task"+e.id}
                            deleteTask={deleteTask}
                            />
                    ))
                }

            </div>
            
        </div>

    )
}

export default TaskContainer