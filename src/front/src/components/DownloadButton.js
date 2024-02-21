
import { useState } from "react"
import axios from "axios";

export default ({ view, viewIndex, subviewIndex, currentFilters, orderBy, isDesc, query }) => {
    const [isDownloading, setIsDownloading] = useState(false)

    const downloadRecords = () => {
        setIsDownloading(true)
        axios.post("/recordsExport", {
            viewIndex,
            subviewIndex,
            filters: currentFilters.map(function (x) {
                return x.query
            }),
            orderBy,
            isDesc,
            query
        }).then((response) => {
            setIsDownloading(false)
            window.download(response.data.content, view.label + ".csv");
        })
    }

    return (
        <div class="downloadButton" onClick={downloadRecords}>
            <i class={`fa ${!isDownloading ? "fa-cloud-download" : "fa-spin fa-circle-notch"}`}></i>
        </div>
    )
}