import { useState, useEffect, useContext } from "react"
import axios from "axios";
import evalExpression from "../../utils/evalExpression";
import {
    useHistory,
    useParams
} from "react-router-dom";
import { ConfigContext } from "../../contexts/ConfigContext";

export default ({ panel, record, view, index }) => {
    const [results, setResults] = useState(null);
    const history = useHistory();
    const { viewIndex } = useParams();
    const config = useContext(ConfigContext)

    useEffect(() => {
        refreshData()
    }, [record])

    const refreshData = () => {
        axios.get("/customQuery", {
            params: {
                viewIndex,
                panelIndex: index,
                query: panel.query || evalExpression(panel.formattedQuery, record),
                primaryValue: record[view.primaryId]
            }
        }).then((response) => {
            setResults(response.data)
        })
    }

    const deleteRow = async (row) => {
        const willDelete = await window.swal({
            title: "Êtes-vous sûr ?",
            text: "Une fois la suppression confirmée, il ne sera pas possible de revenir en arrière.",
            buttons: ["Annuler", "Oui"],
            dangerMode: true
        })
        if (willDelete) {
            try {
                await axios.post("/deleteRecordFromPanel", {
                    viewIndex,
                    panelId: panel.__id__,
                    primaryValue: row[panel.primaryId]
                })
                refreshData();
            } catch (e) {
                window.swal({
                    title: "Erreur",
                    text: "Suppression impossible",
                    dangerMode: true
                })
            }
        }
    }

    return (
        <div>
            {results?.length > 0 ? (
                <table class={`table panelTable ${panel.folded ? "folded" : ""}`}>
                    <thead>
                        <tr>
                            {Object.keys(results[0]).filter(key => key !== panel.primaryId).map((key) =>
                                <th key={key}>{key}</th>
                            )}
                            {panel.canDelete ? <th></th> : null}
                        </tr>
                    </thead>
                    <tbody>
                        {results.map((result) => (
                            <tr
                                class={`record ${panel.canShow ? "" : "nonClickableRow"}`}
                                onClick={() => {
                                    const viewIndex = config.views.findIndex(x => x.type === "table" && x.tableName === panel.tableName)
                                    if (panel.canShow) {
                                        history.push(`/record/${viewIndex}/${result[panel.primaryId]}`)
                                    }
                                }}
                            >
                                {Object.keys(result).filter(key => key !== panel.primaryId).map((key) =>
                                    <td key={key}>
                                        <div
                                            dangerouslySetInnerHTML={{
                                                __html:
                                                    (panel.formattedValues && (key in panel.formattedValues)) ?
                                                        evalExpression(panel.formattedValues[key], result) :
                                                        result[key]
                                            }}
                                        />
                                    </td>
                                )}
                                {panel.canDelete ? (
                                    <td class='deleteIconCell'>
                                        <div
                                            class='deleteIcon'
                                            onClick={(e) => {deleteRow(result); e.stopPropagation()}}
                                        >
                                            <i class='fa fa-minus'></i>
                                        </div>
                                    </td>
                                ) : null}
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : results?.length === 0 ? (
                <div class={`noData panelTable ${panel.folded ? "folded" : ""}`}>Aucune donnée</div>
            ) : null}
        </div>
    )
}
