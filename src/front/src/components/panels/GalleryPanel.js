import { useState, useEffect } from "react"
import {
    useHistory,
    useParams
} from "react-router-dom";
import axios from "axios";

export default ({ panel, record, view }) => {
    const [results, setResults] = useState(null);
    const history = useHistory();
    const { viewIndex } = useParams();

    useEffect(() => {
        refreshData()
    }, [panel.query, record])

    const refreshData = () => {
        axios.get("/customQuery", {
            params: {
                query: panel.query,
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

    const pathField = panel.pathField || "Path"

    return (
        <div>
            {results?.length > 0 ? (
                <div class="gallery">
                    {results.map((result) => (
                        <div class='galleryPicture' key={result[pathField]}>
                            {panel.canDelete ? <div class='deleteIcon' onClick={(e) => {deleteRow(result); e.stopPropagation()}}><i class='fa fa-minus'></i></div> : null}
                            <a href={panel.baseUrl + result[pathField]} target='_blank'>
                                <img
                                    src={panel.baseUrl + result[pathField]}
                                    style={{ width: "100%", height: 150, objectFit: panel.objectFit || "cover" }}
                                    onerror='this.style.height = 0'
                                />
                            </a>
                        </div>
                    ))}
                </div>
            ) : results?.length === 0 ? (
                <div class={`noData panelTable ${panel.folded ? "folded" : ""}`}>Aucune donnée</div>
            ) : null}
        </div>
    )
}
