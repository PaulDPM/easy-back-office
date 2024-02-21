
import {
    useHistory
} from "react-router-dom";

export default () => {
    const history = useHistory();

    return (
        <div class="button backButton" onClick={() => history.goBack()}>Retour</div>
    );
}