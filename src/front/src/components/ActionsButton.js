
import { useContext, useState } from "react"
import {
    useHistory
} from "react-router-dom";
import axios from "axios";
import OutsideClickHandler from "./OutsideClickHandler"
import { ConfigContext } from "../contexts/ConfigContext";

export default ({ viewIndex, record, refreshData }) => {
    const config = useContext(ConfigContext)
    const view = config.views[viewIndex]
    const [actionsOpened, setActionsOpened] = useState(false)
    const history = useHistory()

    const deleteRecord = async () => {
        const willDelete = await window.swal({
            title: "Êtes-vous sûr ?",
            text: "Une fois la suppression confirmée, il ne sera pas possible de revenir en arrière.",
            buttons: ["Annuler", "Oui"],
            dangerMode: true
        })
        if (willDelete) {
            if (view.deleteCallback) {
                axios.post(view.deleteCallback, {
                    id: record[view.primaryId],
                    data: record
                })
            }
            try {
                await axios.post("/deleteRecord", {
                    viewIndex,
                    primaryValue: record[view.primaryId]
                })
                history.push(`/records/${viewIndex}`)
            } catch (e) {
                window.swal({
                    title: "Erreur",
                    text: "Suppression impossible",
                    dangerMode: true
                })
            }
        }
    }

    const customAction = (actionIndex) => () => {
        setActionsOpened(false)
        axios.post("customAction", {
            viewIndex,
            actionIndex,
            selectedRecordIds: [record[view.primaryId]]
        }).then(function (response) {
            if (response.data.message) {
                alert(response.data.message)
            }
            refreshData()
        }).catch(function () {
            window.swal({
                title: "Erreur",
                text: "L'action a échoué",
                dangerMode: true
            })
        });
    }

    return (
        (view.canDuplicate === true) || (view.canDelete !== false) || (view.customActions?.length > 0) ? (
            <OutsideClickHandler onOutsideClick={() => setActionsOpened(false)}>
                <div class="actionButtonsContainer">
                    <div class="button openActionsButton" onClick={() => setActionsOpened(!actionsOpened)}>Actions</div>
                    {actionsOpened ? (
                        <div class="actions">
                            {view.customActions?.map((action, index) => (
                                <div class="action recordAction" onClick={customAction(index)}>{action.label}</div>
                            ))}
                            {view.canDuplicate === true ? <div class="action recordAction duplicateRecord">Dupliquer</div> : null}
                            {view.canDelete !== false ? <div class="action recordAction red" onClick={deleteRecord}>Supprimer</div> : null}
                        </div>
                    ) : null}
                </div>
            </OutsideClickHandler>
        ) : null

    )
}