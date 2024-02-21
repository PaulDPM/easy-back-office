import { useState, useEffect, useContext } from "react"
import axios from "axios";
import {
    Link,
    useParams,
    useHistory
} from "react-router-dom";
import DownloadButton from "../components/DownloadButton"
import UploadButton from "../components/UploadButton"
import AddFilterButton from "../components/AddFilterButton"
import BulkActionsButton from "../components/BulkActionsButton"
import getFormattedValue from "../utils/getFormattedValue"
import { ConfigContext } from '../contexts/ConfigContext'

let _viewIndex = null;
let _page = 1;
let _currentFilters = [];
let _orderBy = null;
let _isDesc = null;
let _query = "";

export default () => {
    const { viewIndex, subviewIndex } = useParams();
    const history = useHistory();
    const [page, setPage] = useState(_page)
    const [currentFilters, setCurrentFilters] = useState(_currentFilters)
    const [orderBy, setOrderBy] = useState(_orderBy);
    const [isDesc, setIsDesc] = useState(_isDesc);
    const [query, setQuery] = useState(_query);
    const [selectedRecordIds, setSelectedRecordIds] = useState([])
    const [data, setData] = useState(null)
    const config = useContext(ConfigContext);
    const view = config.views[viewIndex]

    const filteredColumns = view.columns?.filter(x => !x.hideInTable && !x.hidden)

    useEffect(() => {
        if (viewIndex !== _viewIndex) {
            setPage(1)
            setQuery(null)
            setOrderBy(null)
            setIsDesc(null)
            setQuery("")
            if (selectedRecordIds.length > 0) {
                setSelectedRecordIds([])
            }
            if (currentFilters.length > 0) {
                setCurrentFilters([])
            }
        }
    }, [viewIndex])


    useEffect(() => {
        refreshData()
        _viewIndex = viewIndex;
        _page = page;
        _query = query;
        _currentFilters = currentFilters;
        _orderBy = orderBy;
        _isDesc = isDesc;
    }, [viewIndex, subviewIndex, page, query, currentFilters, orderBy, isDesc])

    function refreshData() {
        setData(null)
        setSelectedRecordIds([])
        axios.post("/records", {
            viewIndex,
            subviewIndex,
            page,
            filters: currentFilters.map(function (x) {
                return x.query
            }),
            orderBy,
            isDesc,
            query
        }).then((response) => {
            if (response.data?.records?.length === 0 && page > 1) {
                setPage(1)
            }
            setData(response.data)
        })
    }

    return (
        <div class="view">
            <div class="scrollable">
                <div class="viewHeader">
                    <div class="viewTitle">{view.label}</div>
                    <div class="viewHeaderActions">
                        <div class="searchBarContainer">
                            <input type="text" placeholder="Rechercher" class="searchBar" value={query} onChange={(e) => setQuery(e.target.value)} />
                            <div class="searchBarIcon">
                                <i class="fa fa-search"></i>
                            </div>
                        </div>
                        <BulkActionsButton
                            viewIndex={viewIndex}
                            selectedRecordIds={selectedRecordIds}
                            refreshData={refreshData}
                        />
                        <AddFilterButton
                            view={view}
                            refreshData={refreshData}
                            onAddFilter={(filter) => setCurrentFilters([...currentFilters, filter])}
                        />
                        {view.canExport !== false ? (
                            <DownloadButton
                                view={view}
                                viewIndex={viewIndex}
                                subviewIndex={subviewIndex}
                                currentFilters={currentFilters}
                                orderBy={orderBy}
                                isDesc={isDesc}
                                query={query}
                            />
                        ) : null}
                        {view.canImport ? (
                            <UploadButton
                                view={view}
                                viewIndex={viewIndex}
                                refreshData={refreshData}
                            />
                        ) : null}
                        {view.canCreate ? (
                            <Link to={`/createRecord/${viewIndex}`}>
                                <div class="plusButton"><i class="fa fa-plus"></i></div>
                            </Link>
                        ) : null}
                    </div>
                </div>
                {currentFilters.length > 0 ? (
                    <div class="filtersContainer">
                        {currentFilters.map((filter, index) => (
                            <div class='filterItem' key={index}>
                                <div class='filterItemLabel'>{filter.label}</div>
                                <div class="filterRemove" onClick={() => {
                                    setCurrentFilters(currentFilters.filter(x => x.query !== filter.query))
                                }}><i class='fa fa-times'></i></div>
                            </div>
                        ))}
                    </div>
                ) : null}
                <table class="table">
                    <thead>
                        <tr>
                            {config.hideMultiselect ? null : <th></th>}
                            {filteredColumns.map((column, index) => {
                                const sortName = column.dataType === "foreign" || column.dataType === "datalist" ? column.formattedValue : column.sortName || column.name
                                return (
                                    <th
                                        class={sortName ? "sortable" : ""}
                                        key={index}
                                        onClick={() => {
                                            if (sortName) {
                                                setOrderBy(sortName)
                                                setIsDesc(orderBy === sortName ? !isDesc : false)
                                            }
                                        }}
                                    >
                                        {column.label}
                                        {sortName ? (
                                            <div class='columnSortIcon'>
                                                <i class={`fas fa-sort${isDesc === true && sortName === orderBy ? "-down" : (isDesc === false && sortName === orderBy ? "-up" : "")}`}></i>
                                            </div>
                                        ) : null}
                                    </th>
                                )
                            })}

                        </tr>
                    </thead>
                    <tbody>
                        {!data ? Array.from({ length: 10 }).map((_, index) => (
                            <tr class='record' key={index}>{
                                Array.from({
                                    length: filteredColumns.length + (config.hideMultiselect ? 0 : 1)
                                }).map((_, cellIndex) => (
                                    <td key={cellIndex}> </td>
                                ))
                            }</tr>
                        )) : null}
                        {data?.records?.map((record) => {
                            const recordId = record[view.primaryId]
                            return (
                                <tr
                                    class={`record ${view.notClickable ? "nonClickableRow" : ""}`}
                                    onClick={(event) => {
                                        if (event.target.tagName == "A") {
                                            event.stopPropagation();
                                            return;
                                        }
                                        if (!view.notClickable) {
                                            const target = view.clickToEdit ? `/editRecord/${viewIndex}/${recordId}` : `/record/${viewIndex}/${recordId}`
                                            if (view.openInNewTab) {
                                                window.open(`/_HOMEPAGE_${target}`, "_blank");
                                            } else {
                                                history.push(target)
                                            }
                                        }
                                    }}
                                    key={recordId}
                                >
                                    {config.hideMultiselect ? null : <td class='checkboxParent' onClick={(e) => {
                                        setSelectedRecordIds(selectedRecordIds.includes(recordId) ? selectedRecordIds.filter(x => x !== recordId) : [...selectedRecordIds, recordId])
                                        e.stopPropagation()
                                    }}><div class={`checkbox ${selectedRecordIds.includes(recordId) ? "checked" : ""}`}></div></td>}
                                    {filteredColumns.map((column, index) => (
                                        <td key={index}>{getFormattedValue(column, record, config, true)}</td>
                                    ))}
                                </tr>
                            )
                        })}
                    </tbody>

                </table>
            </div>
            <div class="tableFooter">
                <div class="tableCounter">{data?.count || "-"} {view.label}</div>
                <div class="paginator">
                    <div class="paginatorLeft" onClick={() => setPage(Math.max(1, page - 1))}><i class="fas fa-caret-left"></i></div>
                    <div class="paginatorNumber">{page} / {data && data.count ? Math.ceil(data.count / (view.limit || 10)) : "-"}</div>
                    <div class="paginatorRight" onClick={() => setPage(Math.min(page + 1, Math.ceil(data.count / (view.limit || 10))))}><i class="fas fa-caret-right"></i></div>
                </div>
            </div>
        </div>
    )
}
