import { useContext, useState } from "react"
import axios from "axios";
import OutsideClickHandler from "./OutsideClickHandler"
import { ConfigContext } from '../contexts/ConfigContext'

export default ({ viewIndex, selectedRecordIds, refreshData }) => {
    const config = useContext(ConfigContext)
    const view = config.views[viewIndex]
    const [bulkActionsOpened, setBulkActionsOpened] = useState(false)

    const bulkDelete = () => {
        window.swal({
            title: "Êtes-vous sûr ?",
            text: "Une fois la suppression confirmée, il ne sera pas possible de revenir en arrière.",
            buttons: ["Annuler", "Oui"],
            dangerMode: true
        }).then((willDelete) => {
            if (willDelete) {
                axios.post("deleteRecords", {
                    viewIndex,
                    primaryValues: selectedRecordIds
                }).then(function () {
                    refreshData()
                }).catch(function () {
                    window.swal({
                        title: "Erreur",
                        text: "Suppression impossible",
                        dangerMode: true
                    })
                });
            }
        });
    }

    const bulkCustomAction = (actionIndex) => () => {
        setBulkActionsOpened(false)
        axios.post("customAction", {
            viewIndex,
            actionIndex,
            selectedRecordIds
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

    return !config.hideMultiselect && (view.canDelete !== false || view.customActions?.length > 0) ? (
        <OutsideClickHandler onOutsideClick={() => setBulkActionsOpened(false)}>
            <div class="actionButtonsContainer">
                <div class="button openBulkActionsButton" onClick={() => setBulkActionsOpened(!bulkActionsOpened)}>Actions</div>
                {bulkActionsOpened ? <div class="bulkActions">
                    {view.customActions?.map((action, index) => (
                        <div class="action recordAction" onClick={bulkCustomAction(index)}>{action.label}</div>
                    ))}
                    {view.canDelete !== false ? <div class="action recordAction red" onClick={bulkDelete}>Supprimer</div> : null}
                </div> : null}
            </div>
        </OutsideClickHandler>
    ) : null
}