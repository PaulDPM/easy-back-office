import axios from "axios";
import evalExpression from "../utils/evalExpression";

export default ({ record, panel }) => {
    const downloadTable = () => {
        axios.get("/customQuery", {
            params: {
                query: panel.query || evalExpression(panel.formattedQuery, record),
                primaryValue: 2630
            }
        }).then((response) => {
            const results = response.data;
            const lines = [];
            lines.push(Object.keys(results[0]).filter(key => key !== panel.primaryId).join(","))
            for (let result of results) {
                lines.push(
                    Object.keys(result).filter(key => key !== panel.primaryId).map((key) =>
                        (panel.formattedValues && (key in panel.formattedValues)) ? evalExpression(panel.formattedValues[key], result) : result[key]
                    ).join(",")
                )
            }

            window.download(lines.join("\r\n"), panel.label + ".csv");
        })
    }

    return (<div class='downloadPanelButton' onClick={downloadTable}><i class='fa fa-cloud-download'></i></div>)
}