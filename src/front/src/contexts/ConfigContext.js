import React, { useEffect, createContext, useState } from "react";
import axios from "axios";

const ConfigContext = createContext(null);

const ConfigProvider = (props) => {
    const [config, setConfig] = useState(null);

    useEffect(() => {
        axios.get("/config").then(response => {
            const _config = eval('(' + response.data.config + ')')
            setConfig(_config)

            if (_config.googleMapsKey) {
                const script = document.createElement('script');
                script.src = "https://maps.googleapis.com/maps/api/js?key=" + _config.googleMapsKey + "&libraries=places,autocomplete";
                document.body.appendChild(script);
                return () => {
                    document.body.removeChild(script);
                }
            }
        })
    }, []);

    return config ? (
        <ConfigContext.Provider value={config} >
            {props.children}
        </ConfigContext.Provider >
    ) : null
};

export { ConfigContext, ConfigProvider };
