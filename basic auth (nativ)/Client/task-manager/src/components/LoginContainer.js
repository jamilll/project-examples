import React from 'react'

function LoginContainer(props) {
    const login = ()=> {
        const un = document.getElementById("input-username").value;
        const up = document.getElementById("input-password").value;
        let brk = false;
        if(un === "" ){
            document.getElementById("user-naut").classList.replace("hidden","visible")
            brk = true
        } else{
            document.getElementById("user-naut").classList.replace("visible","hidden")

        }

        if(up === "" ){
            document.getElementById("pass-naut").classList.replace("hidden","visible")
            brk = true
        }else{
            document.getElementById("pass-naut").classList.replace("visible","hidden")

        }


        if(brk) return

        const u={
            username: un,
            password: up
        }
        props.login(u)
    }
  
    return (
        <div className='login-container login-hide' id='login-container'>
            <div className='input-container'>
                <label> username:</label>
                <input formNoValidate={true} type="text" id='input-username' />
                <h6 id='user-naut' className='hidden'> please enter your username</h6>


            </div>
            <div className='input-container'>
                <label> password</label>
                <input type="password" id='input-password' />
                <h6 id='pass-naut' className='hidden'> please enter your password</h6>
            </div>
            <button onClick={login}>login</button>
        </div>
    )
}

export default LoginContainer