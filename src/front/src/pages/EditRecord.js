import { useContext, useRef, useState, useEffect } from "react";
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
    const { viewIndex, recordId } = useParams();
    const history = useHistory();
    const view = config.views[viewIndex];
    const [record, setRecord] = useState(null);
    const filteredColumns = view.columns.filter(
        column => column.dataType &&
            column.canEdit !== false &&
            !column.hidden
    )

    const dataToUpdate = useRef({})
    const [isUpdating, setIsUpdating] = useState(false)

    useEffect(() => {
        axios.get("/record", {
            params: {
                viewIndex,
                recordId
            }
        }).then((response) => {
            dataToUpdate.current = {};
            setRecord(response.data);
        });
    }, [viewIndex, recordId]);

    const updateRecord = async () => {
        if (!checkRequiredColumns(filteredColumns, {...record, ...dataToUpdate.current})) return;
        setIsUpdating(true)
        try {
            await axios.post("/updateRecord", {
                viewIndex,
                primaryValue: recordId,
                data: dataToUpdate.current,
                previousData: record
            })
            setIsUpdating(false)
            history.push(`/record/${viewIndex}/${recordId}`)
        } catch (error) {
            if (error.response.responseText) {
                window.swal({
                    title: "Erreur",
                    text: error.response.responseText,
                    dangerMode: true
                })
            }
            setIsUpdating(false)
        }
    }

    return (
        <div class="view">
            <div class="viewHeader">
                <div class="viewTitle">{view.label}</div>
            </div>
            <div class="paddedView">
                {record ? (
                    <>
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
                                                initialData={record}
                                                onChange={(newValues) => { dataToUpdate.current = { ...dataToUpdate.current, ...newValues } }}
                                            />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                        <div class={`button greenButton ${isUpdating ? "loading" : ""}`} onClick={updateRecord}>{isUpdating ? "Sauvegarde en cours..." : "Sauvegarder"}</div>
                        <div class="button" onClick={() => history.goBack()}>Annuler</div>
                    </>
                ) : null}
            </div>
        </div>
    )
}