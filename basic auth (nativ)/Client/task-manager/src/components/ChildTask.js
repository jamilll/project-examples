import React, { useState } from 'react'

function ChildTask({props, t, deleteTask}) {
    const [task, SetTask] = useState(t)
    
    const deleteChildTask = ()=>{
        deleteTask(task)
    }


    return (
        <div className='child-task'>
                <div>
                    <h5>
                    {task.name} {task.id}
                    </h5>
                </div>
                <button className="delete-button" onClick={deleteChildTask}> X</button>

        </div>
  )
}

export default ChildTask