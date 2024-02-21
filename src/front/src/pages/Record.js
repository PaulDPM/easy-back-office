import { useState, useEffect, useContext } from "react"
import axios from "axios";
import {
    useParams,
    Link,
} from "react-router-dom";
import getFormattedValue from "../utils/getFormattedValue"
import ActionsButton from "../components/ActionsButton"
import BackButton from "../components/BackButton"
import DownloadTablePanelButton from "../components/DownloadTablePanelButton"
import TablePanel from "../components/panels/TablePanel"
import GalleryPanel from "../components/panels/GalleryPanel"
import MapPanel from "../components/panels/MapPanel"
import { ConfigContext } from '../contexts/ConfigContext'
import ChatPanel from "../components/panels/ChatPanel";

export default () => {
    const config = useContext(ConfigContext)
    const { viewIndex, recordId } = useParams();
    const [record, setRecord] = useState(null);

    const view = config.views[viewIndex]
    const filteredColumns = view.columns?.filter(x => !x.hidden)

    useEffect(() => {
        refreshData()
    }, [viewIndex, recordId]);

    const refreshData = () => {
        axios.get("/record", {
            params: {
                viewIndex,
                recordId
            }
        }).then((response) => {
            setRecord(response.data);
        });
    }

    return (
        <div class="view backgroundBlue">
            <div class="viewHeader">
                <div class="viewTitle">{view.label}</div>
                <div class="viewHeaderActions">
                    <BackButton />
                    <ActionsButton viewIndex={viewIndex} record={record} refreshData={refreshData} />
                    {view.canEdit !== false ? (
                        <Link to={`/editRecord/${viewIndex}/${recordId}`}>
                            <div class="button greenButton recordAction">Modifier</div>
                        </Link>
                    ) : null}
                </div>
            </div>
            <div class="paddedView">
                <div class="showContainer">
                    <div class='panel detailsPanel'>
                        <div class='panelTitle'>Détails</div>
                        {record ?
                            filteredColumns.map((column, index) => (
                                <div class='showRecordField' key={index}>
                                    <div class='formLabel'>{column.label}</div>
                                    <div class='formValue'>{getFormattedValue(column, record, config, false) || "-"}</div>
                                </div>
                            ))
                            : null}
                    </div>
                    {view.recordViewPanels && record ? (
                        <div class='recordViewPanels'>
                            {view.recordViewPanels.map((panel, index) => (
                                <div class='panel' key={index}>
                                    <div class='panelHeader'>
                                        <div class='viewTitle'>{panel.label}</div>
                                        <div class='viewHeaderActions'>
                                            {panel.folded ? <div class='button smallButton unfoldPanel'>Afficher</div> : null}
                                            {panel.canCreate ? <Link to={`/createRecord/${viewIndex}/${index}/${recordId}`}><div class='plusButton'><i class='fa fa-plus'></i></div></Link> : null}
                                            {panel.canDownload && panel.type === "table" ? <DownloadTablePanelButton record={record} panel={panel} /> : null}
                                        </div>
                                    </div>
                                    {panel.type === "table" ? <TablePanel record={record} panel={panel} view={view} index={index} /> : null}
                                    {panel.type === "gallery" ? <GalleryPanel record={record} panel={panel} view={view} index={index} /> : null}
                                    {panel.type === "map" ? <MapPanel record={record} panel={panel} view={view} index={index} /> : null}
                                    {panel.type === "chat" ? <ChatPanel record={record} panel={panel} view={view} index={index} /> : null}
                                </div>
                            ))}
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    )
}
