

import { useContext } from "react";
import {
    useParams
} from "react-router-dom";
import { ConfigContext } from '../contexts/ConfigContext'

export default () => {
    const config = useContext(ConfigContext)
    const { viewIndex } = useParams();
    const view = config.views[viewIndex];

    return (
        <div class="view">
            <iframe src={view.src}></iframe>
        </div>
    )
}