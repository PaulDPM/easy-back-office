import { useContext, useRef, useState } from "react";
import {
    useParams,
    useHistory
} from "react-router-dom";
import axios from "axios";
import Input from "../components/Input"
import LabelTooltip from "../components/LabelTooltip"
import { ConfigContext } from '../contexts/ConfigContext'
import checkRequiredColumns from "../utils/checkRequiredColumns";

export default () => {
    const config = useContext(ConfigContext)
    const { viewIndex, panelIndex, recordId } = useParams();
    const history = useHistory();
    const view = config.views[viewIndex];
    const panel = panelIndex ? view.recordViewPanels[panelIndex] : null;
    const filteredColumns = panel ? panel.createConfig.columns : view.columns.filter(
        column => column.dataType &&
            (column.canEditOnCreation === true || column.canEdit !== false)
            && !column.hidden
    )

    const initialData = {}
    for (const column of filteredColumns) {
        if (column.defaultOption) {
            initialData[column.name] = column.defaultOption
        } else if (column.dataType === "tinyint") {
            initialData[column.name] = column.optional ? "NULL" : "0"
        } else if (column.dataType === "select" && column.optional) {
            initialData[column.name] = "NULL"
        } else if (column.dataType === "select" && Array.isArray(column.options)) {
            initialData[column.name] = column.options[0]
        } else if (column.dataType === "select") {
            initialData[column.name] = Object.keys(column.options)[0]
        }
        if (column.defaultValue) {
            initialData[column.name] = column.defaultValue
        }
    }
    const data = useRef(initialData)
    const [isCreating, setIsCreating] = useState(false)

    const createRecord = async () => {
        if (!checkRequiredColumns(filteredColumns, data.current)) return;
        for (const key in view.createFilters) {
            data.current[key] = view.createFilters[key]
        }
        setIsCreating(true)
        try {
            const response = await axios.post("/createRecord", {
                viewIndex,
                panelIndex,
                recordId,
                data: data.current
            })
            setIsCreating(false)
            if (recordId) { // Create from panel view
                history.push(`/record/${viewIndex}/${recordId}`)
            } else if (view?.createConfig?.redirectToCreatedItems) {
                history.push(`/record/${viewIndex}/${response.data.id}`)
            } else {
                history.push(`/records/${viewIndex}`)
            }
        } catch (error) {
            window.swal({
                title: "Erreur",
                text: axios.isAxiosError(error) ? error.response.data.message : "Une erreur est survenue",
                dangerMode: true
            })
            setIsCreating(false)
        }
    }

    return (
        <div class="view">
            <div class="viewHeader">
                <div class="viewTitle">{panel ? panel.createConfig.label : `Créer ${view.aNewSingular}`}</div>
            </div>
            <div class="paddedView">
                <div class="form">
                    {filteredColumns.map((column, index) => {
                        return (
                            <div class='formElement' key={index}>
                                <div class='formLabel'>
                                    {column.label} {column.required ? "*" : ""}
                                    {column.labelTooltip ? <LabelTooltip text={column.labelTooltip} /> : null}
                                </div>
                                <div class='formInput'>
                                    <Input
                                        column={column}
                                        onChange={(newValues) => { data.current = { ...data.current, ...newValues } }}
                                    />
                                </div>
                            </div>
                        )
                    })}
                </div>
                <div class={`button greenButton ${isCreating ? "loading" : ""}`} onClick={createRecord}>{isCreating ? "Sauvegarde en cours..." : "Créer"}</div>
                <div class="button" onClick={() => history.goBack()}>Annuler</div>
            </div>
        </div>
    )
}