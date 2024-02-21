import axios from "axios";
import { useState } from "react";
import logo from "../images/logo.png"

export default ({ setIsAuthenticated }) => {
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")

    const login = async () => {
        const response = await axios.post("/login", {
            username,
            password
        });
        if (response.data.success) {
            setIsAuthenticated(true)
        }
    }

    return (
        <div class="loginPanelBackground">
            <div class="loginPanel">
                <div class="loginLogoContainer">
                    <img class="loginLogo" src={logo} />
                </div>
                <label>Nom d'utilisateur</label>
                <input type="text" name="username" onChange={(e) => setUsername(e.target.value)} />
                <label>Mot de passe</label>
                <input type="password" name="password" onChange={(e) => setPassword(e.target.value)} />
                <button class="button greenButton fullWidth" onClick={login}>Se connecter</button>
            </div>
        </div>
    )
}