import { useContext } from "react";
import { useParams } from "react-router-dom";
import CustomComponent from "../components/CustomComponent";
import { ConfigContext } from "../contexts/ConfigContext";

export default () => {
    const config = useContext(ConfigContext)
    const { viewIndex } = useParams();

    const componentPath = config.views[viewIndex].componentPath

    return (
        <CustomComponent componentPath={componentPath} />
    )
}